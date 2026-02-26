import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { retrieveChunks } from '@/lib/ai/retrieval/retrieveChunks'
import { formatContext, buildCitationMap } from '@/lib/ai/prompts/formatContext'
import { buildSystemPrompt, type AgentType } from '@/lib/ai/prompts/system'
import { checkDailyQuota, checkAgentAllowed, recordUsage } from '@/lib/ai/usage/quotas'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    messages,
    threadId,
    organizationId,
    agentType = 'startup_lawyer',
    docScope,
  }: {
    messages: Array<{ role: string; content: string }>
    threadId?: string
    organizationId: string
    agentType?: AgentType
    docScope?: string[]
  } = body

  if (!organizationId) {
    return Response.json({ error: 'organizationId is required' }, { status: 400 })
  }

  // Verify org membership
  const { data: membership } = await supabase
    .from('members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!membership) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Quota checks
  const agentCheck = await checkAgentAllowed(organizationId, agentType)
  if (!agentCheck.allowed) {
    return Response.json({ error: agentCheck.reason }, { status: 402 })
  }

  const quotaCheck = await checkDailyQuota(organizationId)
  if (!quotaCheck.allowed) {
    return Response.json({ error: quotaCheck.reason }, { status: 429 })
  }

  // Get organization context
  const { data: org } = await supabase
    .from('organizations')
    .select('name, entity_type, state_of_incorporation, incorporation_date, plan')
    .eq('id', organizationId)
    .single()

  // RAG: retrieve relevant chunks from the document vault
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const chunks = lastUserMessage
    ? await retrieveChunks(lastUserMessage.content, organizationId, docScope)
    : []

  const contextBlock = formatContext(chunks)
  const citationMap = buildCitationMap(chunks)

  // Build system prompt
  const systemPrompt = buildSystemPrompt(agentType, {
    name: org?.name ?? 'Unknown Company',
    entityType: org?.entity_type,
    jurisdiction: org?.state_of_incorporation,
    incorporationDate: org?.incorporation_date,
  }, contextBlock)

  // Create or get thread
  let resolvedThreadId = threadId

  if (!resolvedThreadId) {
    const title = lastUserMessage
      ? lastUserMessage.content.slice(0, 80).trim()
      : 'New conversation'

    const { data: thread } = await supabase
      .from('ai_threads')
      .insert({
        organization_id: organizationId,
        created_by: user.id,
        agent_type: agentType,
        title,
      })
      .select('id')
      .single()

    resolvedThreadId = thread?.id
  }

  // Stream LLM response
  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: messages as any,
    async onFinish({ text, usage }) {
      if (!resolvedThreadId) return

      const tokensIn = usage?.promptTokens ?? 0
      const tokensOut = usage?.completionTokens ?? 0

      // Save user message
      if (lastUserMessage) {
        await supabase.from('ai_messages').insert({
          thread_id: resolvedThreadId,
          organization_id: organizationId,
          role: 'user',
          content: lastUserMessage.content,
          token_usage: {},
        })
      }

      // Save assistant message
      const { data: savedMsg } = await supabase
        .from('ai_messages')
        .insert({
          thread_id: resolvedThreadId,
          organization_id: organizationId,
          role: 'assistant',
          content: text,
          token_usage: { prompt: tokensIn, completion: tokensOut },
        })
        .select('id')
        .single()

      // Save citations
      if (savedMsg && citationMap.size > 0) {
        const citationRows = Array.from(citationMap.values()).map((c) => ({
          message_id: savedMsg.id,
          chunk_id: c.chunkId,
          document_id: c.documentId,
          organization_id: organizationId,
          score: c.score,
        }))
        await supabase.from('ai_citations').insert(citationRows)
      }

      // Update thread timestamp
      await supabase
        .from('ai_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', resolvedThreadId)

      // Record usage
      await recordUsage(organizationId, tokensIn, tokensOut)
    },
  })

  const response = result.toDataStreamResponse()

  // Attach threadId in header so client can persist it
  if (resolvedThreadId) {
    const headers = new Headers(response.headers)
    headers.set('X-Thread-Id', resolvedThreadId)
    return new Response(response.body, {
      status: response.status,
      headers,
    })
  }

  return response
}
