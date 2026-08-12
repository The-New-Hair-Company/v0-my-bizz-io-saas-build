export type GroundedSource = {
  source_kind: 'document' | 'knowledge'
  source_id: string
  document_id: string | null
  title: string
  content: string
  score: number
}

const legalTerms = /contract|legal|law|filing|compliance|incorporat|privacy|policy|agreement|deadline|regulat/i

const stopWords = new Set(['about', 'after', 'also', 'does', 'from', 'have', 'into', 'that', 'their', 'this', 'what', 'when', 'where', 'which', 'with', 'work', 'your'])

export function buildRetrievalQuery(query: string) {
  const terms = Array.from(new Set((query.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((word) => word.length > 2 && !stopWords.has(word)))).slice(0, 8)
  return terms.length ? terms.join(' OR ') : query
}

export function composeGroundedAnswer(query: string, sources: GroundedSource[], agent: 'startup_lawyer' | 'cofounder' | 'public' = 'public') {
  if (!sources.length) {
    return agent === 'public'
      ? `I couldn't find a strong match in the approved MyBizz knowledge base. I can still point you to the discovery wizard, the Agency OS portal, or the team—try asking about intake, projects, security, documents or the grounded assistants.`
      : `I couldn't find enough evidence in this account's knowledge vault to answer that confidently. Add an approved document or rephrase the question with a project, deadline, contract or company detail. I won't invent an answer when the tenant data does not support one.`
  }

  const selected = sources.slice(0, 3)
  const intro = agent === 'startup_lawyer'
    ? legalTerms.test(query) ? 'Here is the clearest evidence-led position from this workspace.' : 'I found relevant workspace evidence, although this is operational guidance rather than legal advice.'
    : agent === 'cofounder'
      ? 'Here is the strongest practical read from the current account evidence.'
      : 'Here is what I found in the approved MyBizz knowledge base.'
  const evidence = selected.map((source, index) => `${index + 1}. **${source.title}** — ${summarise(source.content)}`).join('\n\n')
  const action = agent === 'startup_lawyer'
    ? 'Recommended next move: confirm the governing jurisdiction and critical date, then attach the controlling document before treating this as final.'
    : agent === 'cofounder'
      ? 'Recommended next move: turn the strongest signal above into one accountable project action with an owner and date.'
      : 'You can continue into the intake wizard or sign in to Agency OS for account-specific answers.'
  return `${intro}\n\n${evidence}\n\n${action}\n\n_Sources are retrieved and ranked locally. No paid model tokens were used._`
}

function summarise(content: string) {
  const clean = content.replace(/\s+/g, ' ').trim()
  if (clean.length <= 300) return clean
  const boundary = clean.lastIndexOf(' ', 300)
  return `${clean.slice(0, boundary > 180 ? boundary : 300)}…`
}
