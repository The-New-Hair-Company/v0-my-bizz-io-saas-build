import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages, chatId, organizationId } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get organization details for context
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  // System prompt with compliance context
  const systemPrompt = `You are a helpful AI assistant for MyBizz, a compliance automation platform for startups. 
  
Your role is to help users with:
- Understanding regulatory requirements and filing deadlines
- Answering questions about incorporation, business entities, and compliance
- Providing guidance on state-specific regulations
- Explaining tax obligations and annual reports
- Helping with document requirements

${organization ? `Context about this company:
- Name: ${organization.name}
- Entity Type: ${organization.entity_type || 'Not specified'}
- State: ${organization.state_of_incorporation || 'Not specified'}
` : ''}

Be professional, accurate, and helpful. If you're unsure about something, say so and recommend consulting with a legal professional. Always provide clear, actionable guidance.`

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages,
    async onFinish({ text }) {
      // Save messages to database
      if (chatId) {
        const userMessage = messages[messages.length - 1]
        
        // Save user message
        await supabase.from('messages').insert({
          chat_id: chatId,
          role: 'user',
          content: userMessage.content,
        })

        // Save assistant message
        await supabase.from('messages').insert({
          chat_id: chatId,
          role: 'assistant',
          content: text,
        })

        // Update chat timestamp
        await supabase
          .from('chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', chatId)
      }
    },
  })

  return result.toDataStreamResponse()
}
