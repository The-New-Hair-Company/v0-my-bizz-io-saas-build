export type GroundedSource = {
  source_kind: 'document' | 'knowledge'
  source_id: string
  document_id: string | null
  title: string
  content: string
  score: number
  source_url?: string | null
  category?: string | null
}

export type AssistantMode = 'startup_lawyer' | 'cofounder' | 'public'

const stopWords = new Set([
  'about', 'after', 'also', 'does', 'from', 'have', 'into', 'that', 'their',
  'this', 'what', 'when', 'where', 'which', 'with', 'work', 'would', 'your',
])

const retrievalExpansions: Array<{ pattern: RegExp; terms: string[] }> = [
  { pattern: /director|board|fiduciary|duty|duties/i, terms: ['director', 'duties', 'powers', 'success', 'care', 'judgment'] },
  { pattern: /conflict|interest|related party|personal benefit/i, terms: ['conflict', 'interest', 'declare', 'authorisation'] },
  { pattern: /dividend|distribution|take money|pay myself/i, terms: ['distribution', 'dividend', 'profits', 'accounts', 'shareholder'] },
  { pattern: /share|equity|allot|issue|dilut|pre-emption/i, terms: ['shares', 'allotment', 'authority', 'pre-emption', 'articles'] },
  { pattern: /resolution|vote|decision|meeting|minutes/i, terms: ['resolution', 'written', 'meeting', 'members', 'record'] },
  { pattern: /account|bookkeep|record|filing|confirmation statement|companies house|deadline/i, terms: ['accounting', 'records', 'accounts', 'registrar', 'confirmation', 'filing'] },
  { pattern: /incorporat|form a company|set up|start a company/i, terms: ['formation', 'registration', 'memorandum', 'articles', 'directors', 'shareholders'] },
  { pattern: /registered office|company address|service address/i, terms: ['registered', 'office', 'address', 'records'] },
  { pattern: /security|secure|privacy|access|tenant/i, terms: ['security', 'tenant', 'Clerk', 'Supabase', 'membership'] },
  { pattern: /brief|intake|onboard|start a project/i, terms: ['intake', 'brief', 'wizard', 'account', 'project'] },
  { pattern: /document|knowledge|source|citation|rag|assistant|ai/i, terms: ['knowledge', 'documents', 'retrieval', 'sources', 'assistant'] },
]

export function buildRetrievalQuery(query: string, agent: AssistantMode = 'public') {
  const rawTerms = query.toLowerCase().match(/[a-z0-9]+/g) ?? []
  const terms = rawTerms.filter((word) => word.length > 2 && !stopWords.has(word))
  for (const expansion of retrievalExpansions) {
    if (expansion.pattern.test(query)) terms.push(...expansion.terms)
  }
  if (agent === 'startup_lawyer') terms.push('company', 'Companies', 'Act', '2006')
  return Array.from(new Set(terms)).slice(0, 18).join(' OR ') || query
}

export function composeGroundedAnswer(
  query: string,
  sources: GroundedSource[],
  agent: AssistantMode = 'public',
) {
  if (agent === 'startup_lawyer') return composeLegalGuidance(query, sources)
  if (agent === 'cofounder') return composeCofounderGuidance(query, sources)
  return composePublicAnswer(query, sources)
}

function composePublicAnswer(query: string, sources: GroundedSource[]) {
  if (!sources.length) {
    return "I don’t have a reliable answer for that yet. I’m best at showing how MyBizz handles a new brief, keeps client work organised, protects account data and answers questions from approved documents. Try one of those, or open the discovery chat and tell us what you need."
  }

  if (/secure|privacy|access|tenant|data/i.test(query)) {
    return 'Your workspace is private by design. Clerk confirms who the user is, then the database checks their membership before returning or changing an account record. In plain English: signing in is not enough on its own — the user must also belong to that specific workspace.\n\nThat same boundary covers projects, files, tasks and assistant conversations.'
  }
  if (/brief|intake|onboard|start|project/i.test(query)) {
    return 'You start with a short, guided conversation about the business and the work you need. MyBizz turns those answers into a structured brief, creates the client account and gives the delivery team a clear place to begin.\n\nNo copying answers into another CRM, and no long form full of irrelevant questions.'
  }
  if (/document|knowledge|source|citation|rag|assistant|ai/i.test(query)) {
    return 'Add the documents your team already trusts, then ask a normal question. MyBizz finds the closest evidence, shows where it came from and gives you a useful next step.\n\nIf the evidence is missing, it says so instead of inventing an answer.'
  }
  if (/price|plan|cost|free/i.test(query)) {
    return 'You can create a workspace and try the core intelligence experience free. Paid plans increase the number of questions, intelligence runs, files and team seats — your existing workspace stays intact when you upgrade.'
  }

  return 'MyBizz gives a small team one calm place to ask questions, receive a useful next step and turn that decision into organised work. The clever part stays in the background: client accounts, documents, delivery and access control all support the conversation.\n\nThe easiest way to understand it is to try the chat with a real question.'
}

type LegalIntent =
  | 'conflict'
  | 'dividend'
  | 'shares'
  | 'decision'
  | 'filing'
  | 'incorporation'
  | 'registered_office'
  | 'director_duties'
  | 'general'

function detectLegalIntent(query: string): LegalIntent {
  if (/conflict|interest|related party|personal benefit|company opportunity/i.test(query)) return 'conflict'
  if (/dividend|distribution|take money|pay myself/i.test(query)) return 'dividend'
  if (/share|equity|allot|issue|dilut|pre-emption/i.test(query)) return 'shares'
  if (/resolution|vote|decision|meeting|minutes/i.test(query)) return 'decision'
  if (/account|bookkeep|record|filing|confirmation statement|companies house|deadline/i.test(query)) return 'filing'
  if (/incorporat|form a company|set up|start a company/i.test(query)) return 'incorporation'
  if (/registered office|company address|service address/i.test(query)) return 'registered_office'
  if (/director|board|fiduciary|duty|duties|section 17[1-7]/i.test(query)) return 'director_duties'
  return 'general'
}

function composeLegalGuidance(query: string, sources: GroundedSource[]) {
  const selected = sources.slice(0, 4)
  const disclaimer = 'This is general information to help you understand the issue and prepare your next step. It is not legal advice and is not a substitute for advice from a solicitor who has reviewed your circumstances.'
  if (!selected.length) {
    return `I don’t have enough reliable source material to guide you on that safely. Tell me the company’s jurisdiction, whether it is private or public, and the decision or deadline you are dealing with. If the matter is urgent, disputed or could expose the company or a director to loss, speak to a solicitor promptly.\n\n${disclaimer}`
  }

  const intent = detectLegalIntent(query)
  const cite = (...needles: string[]) => referenceFor(selected, needles)
  const urgent = /insolven|creditor|claim|court|breach|fraud|remove a director|deadlock|unfair prejudice|urgent/i.test(query)
  let body: string

  switch (intent) {
    case 'conflict':
      body = `The practical answer is: surface the conflict early and create a clean decision trail. A director should not quietly use a company opportunity, property or information for personal benefit, and a direct or indirect interest in a proposed company transaction should be declared to the other directors before the company enters into it.${cite('avoid conflicts', 'declare interest')}\n\nWhat I would do now:\n1. Write down the nature and extent of the interest.\n2. Check the articles for the company’s authorisation and quorum rules.\n3. Keep the interested director out of the approval decision where required.\n4. Record the disclosure, who decided, and why the decision was in the company’s interests.\n\nDo not treat a casual conversation or disclosure only to shareholders as a safe substitute for the company’s proper process.`
      break
    case 'dividend':
      body = `A dividend is not simply money available in the bank. The company should have profits available for distribution, supported by the relevant accounts, and the payment must follow the rights attached to the shares.${cite('distributions', 'profits available', 'dividend')}\n\nBefore paying it:\n1. Ask the accountant to confirm distributable profits, not just cash balance.\n2. Check the articles and share rights.\n3. Make and retain the proper board or shareholder record.\n4. Produce the dividend paperwork and keep it with the company records.\n\nIf the company may struggle to pay creditors, pause. The directors’ focus can shift towards creditor interests as insolvency approaches.${cite('creditors', 'success of the company')}`
      break
    case 'shares':
      body = `Issuing shares is a governance decision as well as a funding decision. Check whether the directors have authority to allot, whether existing shareholders have pre-emption rights, and whether the articles or a shareholders’ agreement add further consent requirements.${cite('allot shares', 'pre-emption', 'share authority')}\n\nA sensible sequence is:\n1. Confirm the commercial deal and resulting ownership percentages.\n2. Check authority, pre-emption and class rights.\n3. Approve the allotment through the correct company process.\n4. Update the register of members, issue the required evidence and make the Companies House filing.\n\nDo not rely on a cap table alone — it is not the company’s statutory register.`
      break
    case 'decision':
      body = `First identify who legally owns the decision: the board, the shareholders, or both. The Companies Act distinguishes board management from member resolutions, and private companies can often use written member resolutions where the statutory and constitutional rules are met.${cite('written resolutions', 'company decisions', 'resolutions')}\n\nFor a defensible record, state the decision, the information considered, any conflicts, the vote or consent threshold, and the date it took effect. Then retain the resolution and minutes with the company’s records.\n\nThe wording matters more where the decision changes share rights, articles, ownership or a director’s position, so those are good points to have a solicitor check the documents before signature.`
      break
    case 'filing':
      body = `Treat annual accounts and the confirmation statement as separate obligations. Every company must keep adequate accounting records, and directors remain responsible even where an accountant or filing agent handles the submission.${cite('accounting records', 'file accounts', 'confirmation statement')}\n\nA useful control is a compliance calendar containing the accounts deadline, confirmation statement review period, corporation tax dates and event-driven filings for changes to directors, registered office, shares or people with significant control.\n\nCheck the company’s live Companies House record before relying on a generic date, because the exact deadline depends on its accounting reference date and filing history.`
      break
    case 'incorporation':
      body = `For a straightforward private company, decide the ownership and control before submitting the form. The registration package covers the company’s proposed officers, share capital or guarantee position, registered office, constitution and statement of compliance.${cite('formation', 'registration documents', 'effect of registration')}\n\nBefore filing, agree:\n1. Who owns the shares and in what proportions.\n2. Who will be directors and who has significant control.\n3. Which articles will govern decisions and transfers.\n4. The registered office, registered email and record-keeping arrangements.\n\nIf founders are contributing unequal cash, IP or time, a tailored shareholders’ agreement and IP assignment are usually more important than the incorporation form itself.`
      break
    case 'registered_office':
      body = `The registered office is the company’s official address, not merely a contact preference. It must satisfy the statutory requirements for the company’s jurisdiction, and official communications sent there need to reach the company reliably.${cite('registered office', 'company address')}\n\nUse an address that is monitored, update Companies House promptly if it changes, and keep the registered email and location of company records aligned with the current filing requirements. Avoid using a home address casually because information on the public register can be difficult to unwind.`
      break
    case 'director_duties':
      body = `A director is expected to use the company’s powers for their proper purpose, exercise independent judgment, promote the company’s success in good faith, and apply reasonable care, skill and diligence.${cite('act within powers', 'promote the success', 'reasonable care')}\n\nFor an important decision, the best protection is a good process: read the relevant information, test the downside, consider employees and key business relationships, identify conflicts, and record why the chosen course benefits the company as a whole. The law does not demand perfect hindsight, but it does expect an honest and properly informed decision process.\n\nIf the company is approaching insolvency, the analysis changes and creditor interests may become central. Take specialist advice early rather than waiting for a missed payment or formal demand.`
      break
    default:
      body = `There is a company-law angle here, but the safest answer depends on the decision, the company’s articles and the surrounding facts. The retrieved material points to ${naturalList(selected.map((source) => source.title.toLowerCase()).slice(0, 3))}.${cite(selected[0].title)}\n\nTell me what outcome you want, who is making the decision, whether anyone has a personal interest, and whether there is a deadline. I can then turn the relevant rules into a practical checklist rather than giving you a generic summary of the Act.`
  }

  const escalation = urgent
    ? '\n\nBecause your question may involve insolvency, a dispute, personal exposure or an urgent deadline, speak to a UK solicitor promptly and preserve the relevant records and communications.'
    : ''
  return `${body}${escalation}\n\n${disclaimer}`
}

function composeCofounderGuidance(query: string, sources: GroundedSource[]) {
  if (!sources.length) {
    return 'I can help, but I would be guessing without enough evidence from this workspace. Give me the goal, the constraint that matters most, and the decision you need to make this week. I’ll turn that into a focused recommendation.'
  }

  const selected = sources.slice(0, 3)
  const evidence = selected.map((source, index) => `${index + 1}. ${source.title}: ${plainSummary(source.content, 170)}`).join('\n')
  const recommendation = /priorit|week|next|action/i.test(query)
    ? 'Choose one outcome that materially reduces delivery or revenue risk, give it one owner, and set a date close enough to force a decision.'
    : /price|revenue|margin|commercial/i.test(query)
      ? 'Test the decision against customer value, delivery cost and the behaviour you want the price to encourage before changing the number.'
      : /risk|late|deadline|block/i.test(query)
        ? 'Address the earliest dependency that can make several later tasks fail; that is usually more valuable than clearing the longest task list.'
        : 'Make the smallest decision that creates new evidence, then use the result to decide whether to scale, change course or stop.'

  return `My read\n${recommendation}\n\nWhat the workspace is telling us\n${evidence}\n\nWhat I would do next\nTurn the recommendation into one named action today. Assign an owner, a decision date and the evidence that would change your mind. That keeps the team moving without pretending the current data is more certain than it is.`
}

function referenceFor(sources: GroundedSource[], needles: string[]) {
  const lowered = needles.map((needle) => needle.toLowerCase())
  const index = sources.findIndex((source) => {
    const haystack = `${source.title} ${source.content}`.toLowerCase()
    return lowered.some((needle) => haystack.includes(needle))
  })
  return ` [${index >= 0 ? index + 1 : 1}]`
}

function plainSummary(content: string, limit: number) {
  const clean = content.replace(/\s+/g, ' ').trim()
  const sentence = clean.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? clean
  if (sentence.length <= limit) return sentence
  const boundary = sentence.lastIndexOf(' ', limit)
  return `${sentence.slice(0, boundary > limit * 0.6 ? boundary : limit)}…`
}

function naturalList(items: string[]) {
  if (items.length < 2) return items[0] ?? 'the available company material'
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}
