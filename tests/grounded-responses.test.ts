import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildRetrievalQuery,
  composeGroundedAnswer,
  type GroundedSource,
} from '../lib/ai/grounded.ts'

const legalSources: GroundedSource[] = [
  {
    source_kind: 'knowledge',
    source_id: 'distributions',
    document_id: null,
    title: 'Distributions and dividends — Companies Act 2006, Part 23',
    content:
      'A company may make a distribution only out of profits available for the purpose, supported by the relevant accounts.',
    score: 0.92,
    source_url: 'https://www.legislation.gov.uk/ukpga/2006/46/part/23',
    category: 'uk_company_law',
  },
  {
    source_kind: 'knowledge',
    source_id: 'director-duties',
    document_id: null,
    title: 'Directors’ general duties — Companies Act 2006',
    content:
      'Directors must act within powers, promote the success of the company and exercise reasonable care, skill and diligence.',
    score: 0.89,
    source_url: 'https://www.legislation.gov.uk/ukpga/2006/46/part/10/chapter/2',
    category: 'uk_company_law',
  },
]

test('legal retrieval expands ordinary language into Companies Act concepts', () => {
  const query = buildRetrievalQuery('Can I pay myself from the company?', 'startup_lawyer')

  assert.match(query, /distribution/i)
  assert.match(query, /profits/i)
  assert.match(query, /Companies/i)
  assert.match(query, /2006/)
})

test('company law guidance explains the practical rule and always carries a legal disclaimer', () => {
  const answer = composeGroundedAnswer(
    'Can I pay myself a dividend this week?',
    legalSources,
    'startup_lawyer',
  )

  assert.match(answer, /profits available for distribution/i)
  assert.match(answer, /cash balance/i)
  assert.match(answer, /\[1\]/)
  assert.match(answer, /not legal advice/i)
  assert.match(answer, /not a substitute for advice from a solicitor/i)
  assert.doesNotMatch(answer, /Section 830 provides/i)
})

test('company law guidance fails safely when no reliable source was retrieved', () => {
  const answer = composeGroundedAnswer(
    'What should I do?',
    [],
    'startup_lawyer',
  )

  assert.match(answer, /don’t have enough reliable source material/i)
  assert.match(answer, /not legal advice/i)
})

test('public assistant stays conversational and does not expose legal knowledge', () => {
  const answer = composeGroundedAnswer(
    'How does the assistant use my documents?',
    [
      {
        source_kind: 'knowledge',
        source_id: 'rag',
        document_id: null,
        title: 'Grounded workspace answers',
        content: 'Answers are retrieved from approved workspace documents and show their source.',
        score: 0.95,
        category: 'ai',
      },
    ],
    'public',
  )

  assert.match(answer, /documents your team already trusts/i)
  assert.match(answer, /useful next step/i)
  assert.doesNotMatch(answer, /Companies Act/i)
})

test('cofounder answers lead with a decision and state what would change it', () => {
  const answer = composeGroundedAnswer(
    'What should we prioritise this week?',
    legalSources,
    'cofounder',
  )

  assert.match(answer, /^My read/m)
  assert.match(answer, /What the workspace is telling us/)
  assert.match(answer, /evidence that would change your mind/i)
})
