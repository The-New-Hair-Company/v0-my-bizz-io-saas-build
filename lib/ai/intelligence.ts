export const intelligenceWorkflowKeys = ['weekly-priorities', 'delivery-risk', 'growth-brief', 'readiness-review'] as const
export type IntelligenceWorkflowKey = (typeof intelligenceWorkflowKeys)[number]

type RecordLike = Record<string, any>

export type IntelligenceInput = {
  workflowKey: IntelligenceWorkflowKey
  question?: string | null
  organization: RecordLike
  projects: RecordLike[]
  tasks: RecordLike[]
  deadlines: RecordLike[]
  intakes: RecordLike[]
  documents: RecordLike[]
  activities: RecordLike[]
  members: RecordLike[]
}

export type IntelligenceSource = {
  source_kind: 'account' | 'project' | 'task' | 'deadline' | 'intake' | 'document' | 'activity'
  source_id: string
  title: string
  excerpt: string
  relevance: number
  source_updated_at: string | null
}

export type IntelligenceReport = {
  headline: string
  summary: string
  confidence: number
  score: number
  scoreLabel: string
  narrative: string
  scorecard: Array<{ label: string; value: number; detail: string }>
  signals: Array<{ type: 'risk' | 'opportunity' | 'decision'; title: string; detail: string; severity: 'low' | 'medium' | 'high' | 'critical'; confidence: number }>
  priorities: Array<{ title: string; rationale: string; owner: string; horizon: string; impact: 'Protect' | 'Grow' | 'Decide' }>
  actions: Array<{ title: string; detail: string; dueInDays: number; priority: 'medium' | 'high' | 'urgent' }>
  sources: IntelligenceSource[]
  coverage: Array<{ label: string; count: number; status: 'live' | 'thin' }>
}

const dayMs = 86_400_000

export function buildIntelligenceReport(input: IntelligenceInput): IntelligenceReport {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const openTasks = input.tasks.filter((item) => !['done', 'cancelled'].includes(item.status))
  const overdueTasks = openTasks.filter((item) => item.due_date && item.due_date < today)
  const urgentTasks = openTasks.filter((item) => ['urgent', 'high'].includes(item.priority))
  const openDeadlines = input.deadlines.filter((item) => item.status !== 'filed')
  const overdueDeadlines = openDeadlines.filter((item) => item.due_date && item.due_date < today)
  const dueSoon = openDeadlines.filter((item) => daysUntil(item.due_date, now) >= 0 && daysUntil(item.due_date, now) <= 14)
  const activeProjects = input.projects.filter((item) => !['launch', 'complete', 'completed', 'cancelled'].includes(item.status))
  const stalledProjects = activeProjects.filter((item) => daysSince(item.updated_at, now) > 14 || Number(item.progress ?? 0) < 20)
  const readyDocuments = input.documents.filter((item) => item.ingest_status === 'ready' || Number(item.chunk_count ?? 0) > 0)
  const health = clamp(Number(input.organization.health_score ?? 70), 0, 100)
  const onboarding = clamp(Number(input.organization.onboarding_progress ?? 0), 0, 100)
  const riskPenalty = Math.min(65, overdueTasks.length * 8 + overdueDeadlines.length * 15 + dueSoon.length * 5 + stalledProjects.length * 7)
  const deliveryScore = clamp(Math.round((health + onboarding) / 2 - riskPenalty / 2 + Math.min(10, readyDocuments.length * 2)), 5, 98)
  const evidenceScore = clamp(25 + readyDocuments.length * 13 + input.activities.length * 2 + input.intakes.length * 8, 20, 96)
  const executionScore = clamp(88 - overdueTasks.length * 10 - urgentTasks.length * 3 - stalledProjects.length * 7, 8, 98)
  const readinessScore = clamp(Math.round((evidenceScore + executionScore + onboarding) / 3), 10, 98)
  const confidence = clamp(44 + Math.min(22, readyDocuments.length * 7) + Math.min(12, input.activities.length * 2) + Math.min(12, input.tasks.length) + Math.min(8, input.projects.length * 2), 44, 96)
  const score = scoreForWorkflow(input.workflowKey, { deliveryScore, evidenceScore, executionScore, readinessScore })

  const signals = buildSignals({
    overdueTasks,
    urgentTasks,
    overdueDeadlines,
    dueSoon,
    stalledProjects,
    readyDocuments,
    intakes: input.intakes,
    health,
    confidence,
  })
  const workflowCopy = workflowLanguage(input.workflowKey, signals, input.organization.name ?? 'this workspace')
  const sources = buildSources(input, now)
  const priorities = buildPriorities(input.workflowKey, signals, activeProjects, openTasks, openDeadlines)
  const actions = priorities.slice(0, 4).map((priority, index) => ({
    title: priority.title,
    detail: priority.rationale,
    dueInDays: [2, 5, 7, 10][index] ?? 14,
    priority: index === 0 && signals.some((signal) => signal.severity === 'critical') ? 'urgent' as const : index < 2 ? 'high' as const : 'medium' as const,
  }))

  return {
    headline: workflowCopy.headline,
    summary: workflowCopy.summary,
    narrative: `${workflowCopy.narrative} This assessment used ${sources.length} live records across the tenant boundary and produced a ${confidence}% evidence confidence score.`,
    confidence,
    score,
    scoreLabel: score >= 80 ? 'Strong' : score >= 60 ? 'Watch' : 'Intervention required',
    scorecard: [
      { label: 'Delivery health', value: deliveryScore, detail: `${activeProjects.length} active projects` },
      { label: 'Execution control', value: executionScore, detail: `${overdueTasks.length} overdue actions` },
      { label: 'Evidence depth', value: evidenceScore, detail: `${readyDocuments.length} indexed files` },
      { label: 'Decision readiness', value: readinessScore, detail: `${onboarding}% profile complete` },
    ],
    signals: signals.slice(0, 6),
    priorities,
    actions,
    sources,
    coverage: [
      { label: 'Projects', count: input.projects.length, status: input.projects.length ? 'live' : 'thin' },
      { label: 'Actions', count: input.tasks.length, status: input.tasks.length ? 'live' : 'thin' },
      { label: 'Deadlines', count: input.deadlines.length, status: input.deadlines.length ? 'live' : 'thin' },
      { label: 'Knowledge', count: readyDocuments.length, status: readyDocuments.length ? 'live' : 'thin' },
      { label: 'Activity', count: input.activities.length, status: input.activities.length ? 'live' : 'thin' },
    ],
  }
}

function buildSignals(input: RecordLike) {
  const signals: IntelligenceReport['signals'] = []
  if (input.overdueDeadlines.length) signals.push({ type: 'risk', title: `${input.overdueDeadlines.length} deadline${input.overdueDeadlines.length === 1 ? '' : 's'} already exposed`, detail: 'Open obligations have passed their due date and should be triaged before new work is accepted.', severity: 'critical', confidence: input.confidence })
  if (input.overdueTasks.length) signals.push({ type: 'risk', title: `${input.overdueTasks.length} overdue action${input.overdueTasks.length === 1 ? '' : 's'}`, detail: 'Execution debt is accumulating across accountable work and is likely to distort delivery forecasts.', severity: input.overdueTasks.length > 2 ? 'high' : 'medium', confidence: input.confidence })
  if (input.dueSoon.length) signals.push({ type: 'decision', title: `${input.dueSoon.length} immovable date${input.dueSoon.length === 1 ? '' : 's'} inside 14 days`, detail: 'Near-term commitments need explicit owners, evidence and escalation rules.', severity: 'high', confidence: input.confidence })
  if (input.stalledProjects.length) signals.push({ type: 'risk', title: `${input.stalledProjects.length} delivery stream${input.stalledProjects.length === 1 ? '' : 's'} losing momentum`, detail: 'Low progress or stale updates indicate a likely dependency, scope or ownership constraint.', severity: 'high', confidence: input.confidence - 3 })
  if (!input.readyDocuments.length) signals.push({ type: 'decision', title: 'Evidence base is too thin', detail: 'No indexed tenant document is available to validate strategic or governance conclusions.', severity: 'high', confidence: 92 })
  if (input.readyDocuments.length) signals.push({ type: 'opportunity', title: `${input.readyDocuments.length} indexed source${input.readyDocuments.length === 1 ? '' : 's'} ready for retrieval`, detail: 'The knowledge layer can support grounded decisions without sending data to a paid model.', severity: 'low', confidence: input.confidence })
  if (input.intakes.length) signals.push({ type: 'opportunity', title: 'Fresh demand signal is available', detail: 'Recent intake data can be converted into a scoped commercial or delivery decision.', severity: 'medium', confidence: input.confidence - 5 })
  if (!signals.length) signals.push({ type: 'opportunity', title: 'The operating baseline is controlled', detail: 'No material exception is visible; use the next cycle to improve evidence depth and leading indicators.', severity: 'low', confidence: input.confidence })
  return signals
}

function buildPriorities(workflow: IntelligenceWorkflowKey, signals: IntelligenceReport['signals'], projects: RecordLike[], tasks: RecordLike[], deadlines: RecordLike[]) {
  const priorities: IntelligenceReport['priorities'] = []
  const critical = signals.find((signal) => signal.severity === 'critical' || signal.severity === 'high')
  if (critical) priorities.push({ title: critical.title, rationale: critical.detail, owner: 'Workspace owner', horizon: 'Next 48 hours', impact: 'Protect' })
  if (deadlines.length) priorities.push({ title: 'Lock the next immovable commitment', rationale: 'Confirm the evidence, owner and escalation path for the closest open deadline.', owner: 'Delivery lead', horizon: 'This week', impact: 'Protect' })
  if (projects.length) priorities.push({ title: `Move ${projects[0].name ?? 'the lead project'} to its next proof point`, rationale: 'Replace progress commentary with one measurable acceptance condition and a dated owner.', owner: 'Project owner', horizon: 'This week', impact: 'Decide' })
  if (workflow === 'growth-brief') priorities.push({ title: 'Turn the strongest intake signal into one offer experiment', rationale: 'Use live brief language to test positioning, scope and commercial urgency before broadening the campaign.', owner: 'Growth lead', horizon: 'Next 10 days', impact: 'Grow' })
  if (workflow === 'readiness-review') priorities.push({ title: 'Close the highest-value evidence gap', rationale: 'Index the controlling brief, agreement or decision record so future recommendations can cite it.', owner: 'Workspace admin', horizon: 'This week', impact: 'Decide' })
  if (!tasks.length) priorities.push({ title: 'Create the first accountable operating action', rationale: 'The workspace has no open execution trail; translate the chosen priority into an owner and date.', owner: 'Workspace owner', horizon: 'Today', impact: 'Decide' })
  if (priorities.length < 3) priorities.push({ title: 'Refresh the weekly signal review', rationale: 'Re-run after delivery changes so risk and evidence confidence remain current.', owner: 'Workspace owner', horizon: 'Next 7 days', impact: 'Grow' })
  return priorities.slice(0, 4)
}

function buildSources(input: IntelligenceInput, now: Date): IntelligenceSource[] {
  const sources: IntelligenceSource[] = [{
    source_kind: 'account',
    source_id: String(input.organization.id),
    title: String(input.organization.name ?? 'Workspace profile'),
    excerpt: `Health ${input.organization.health_score ?? 70}/100 · onboarding ${input.organization.onboarding_progress ?? 0}% · status ${input.organization.account_status ?? 'active'}`,
    relevance: 0.99,
    source_updated_at: input.organization.updated_at ?? null,
  }]
  const add = (kind: IntelligenceSource['source_kind'], rows: RecordLike[], title: (row: RecordLike) => string, excerpt: (row: RecordLike) => string, base: number) => {
    rows.slice(0, 6).forEach((row, index) => sources.push({ source_kind: kind, source_id: String(row.id), title: title(row), excerpt: excerpt(row), relevance: clamp(base - index * 0.04, 0.45, 0.98), source_updated_at: row.updated_at ?? row.created_at ?? row.submitted_at ?? null }))
  }
  add('deadline', [...input.deadlines].sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))), (row) => row.title ?? 'Deadline', (row) => `${row.status ?? 'open'} · due ${row.due_date ?? 'unscheduled'} · ${row.jurisdiction ?? 'no jurisdiction'}`, 0.96)
  add('task', [...input.tasks].sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)), (row) => row.title ?? 'Action', (row) => `${row.priority ?? 'medium'} priority · ${row.status ?? 'todo'} · due ${row.due_date ?? 'unscheduled'}`, 0.92)
  add('project', input.projects, (row) => row.name ?? 'Project', (row) => `${row.status ?? 'active'} · ${row.progress ?? 0}% complete · target ${row.target_launch ?? 'not set'}`, 0.88)
  add('document', input.documents.filter((row) => row.ingest_status === 'ready' || row.chunk_count > 0), (row) => row.title ?? 'Knowledge file', (row) => `${row.document_type ?? 'document'} · ${row.chunk_count ?? 0} indexed passages`, 0.84)
  add('intake', input.intakes, (row) => row.company_name ?? row.project_name ?? 'Client brief', (row) => `Submitted ${row.submitted_at ? Math.max(0, Math.round(daysSince(row.submitted_at, now))) + ' days ago' : 'recently'} · ${row.status ?? 'new'}`, 0.78)
  add('activity', input.activities, (row) => row.title ?? row.action ?? 'Workspace activity', (row) => row.description ?? row.detail ?? row.event_type ?? 'Recorded operational event', 0.7)
  return sources.sort((a, b) => b.relevance - a.relevance).slice(0, 16)
}

function workflowLanguage(workflow: IntelligenceWorkflowKey, signals: IntelligenceReport['signals'], accountName: string) {
  const primary = signals[0]
  if (workflow === 'delivery-risk') return { headline: primary.severity === 'critical' ? 'Delivery intervention is required now' : 'Delivery is controllable, with visible pressure points', summary: primary.detail, narrative: `The risk radar for ${accountName} prioritises deadline exposure, execution debt and stalled delivery signals.` }
  if (workflow === 'growth-brief') return { headline: 'Growth should follow the strongest live demand signal', summary: 'The portfolio has credible leverage when intake language, delivery capacity and accountable experiments are connected.', narrative: `The growth brief for ${accountName} favours evidence-backed offer tests over generic activity.` }
  if (workflow === 'readiness-review') return { headline: 'Decision readiness depends on closing the evidence gap', summary: primary.detail, narrative: `The readiness review for ${accountName} tests whether ownership, timing and source coverage support a defensible commitment.` }
  return { headline: primary.severity === 'critical' ? 'Protect the critical path before adding work' : 'This week has a clear, evidence-backed priority stack', summary: primary.detail, narrative: `The weekly brief for ${accountName} ranks the few actions most likely to improve delivery confidence and commercial momentum.` }
}

function scoreForWorkflow(workflow: IntelligenceWorkflowKey, scores: RecordLike) {
  if (workflow === 'delivery-risk') return scores.deliveryScore
  if (workflow === 'readiness-review') return scores.readinessScore
  if (workflow === 'growth-brief') return clamp(Math.round((scores.evidenceScore + scores.executionScore) / 2), 5, 98)
  return clamp(Math.round((scores.deliveryScore + scores.executionScore + scores.readinessScore) / 3), 5, 98)
}

function priorityRank(priority: string) { return ({ urgent: 4, high: 3, medium: 2, low: 1 } as Record<string, number>)[priority] ?? 0 }
function daysUntil(value: string | null | undefined, now: Date) { return value ? Math.ceil((new Date(value).getTime() - now.getTime()) / dayMs) : 9999 }
function daysSince(value: string | null | undefined, now: Date) { return value ? (now.getTime() - new Date(value).getTime()) / dayMs : 9999 }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)) }
