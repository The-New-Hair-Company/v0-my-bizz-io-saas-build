# AI RAG Implementation Plan — MyBizz

## Overview
Multi-tenant AI chat system with Retrieval Augmented Generation (RAG) for the "AI Startup Lawyer"
and "AI Cofounder" agents. All answers grounded in the company's own document vault with citations.

## Architecture

```
User message
  → quota check (ai_usage_daily vs plan_limits)
  → embed query  (lib/ai/embeddings/provider.ts)
  → retrieve top-K chunks (lib/ai/retrieval/retrieveChunks.ts) [RLS-safe]
  → build context block (lib/ai/prompts/formatContext.ts)
  → streamText via Vercel AI SDK → /api/ai/chat
  → save ai_messages + ai_citations + update ai_usage_daily
  → stream to ChatStream.tsx with CitationsPanel.tsx
```

## Table Map
| Table | Purpose |
|---|---|
| `documents` | existing — vault files |
| `document_chunks` | vector chunks per doc |
| `ai_threads` | conversation threads (agent-scoped) |
| `ai_messages` | messages per thread |
| `ai_citations` | chunk refs per assistant message |
| `ai_usage_daily` | per-company daily token/cost tracking |
| `plan_limits` | per-plan quota config |

## Key Files Created
```
docs/ai-rag-plan.md             ← this file
docs/ai-rag-ops.md              ← ops runbook

scripts/013_pgvector.sql
scripts/014_ai_rag_tables.sql
scripts/015_ai_rag_rls.sql
scripts/016_storage_bucket.sql

lib/ai/embeddings/provider.ts   ← provider abstraction
lib/ai/embeddings/hash.ts       ← content hashing
lib/ai/retrieval/retrieveChunks.ts
lib/ai/prompts/system.ts
lib/ai/prompts/formatContext.ts
lib/ai/policies/redactions.ts
lib/ai/usage/costEstimate.ts
lib/ai/usage/quotas.ts
lib/ingest/fileParsers.ts
lib/ingest/chunker.ts
lib/ingest/ingestDocument.ts
lib/jobs/queue.ts
lib/jobs/inlineQueue.ts
lib/jobs/inngest.ts             ← stub

app/api/ai/chat/route.ts
app/api/ai/threads/route.ts
app/api/ai/threads/[threadId]/messages/route.ts
app/api/documents/[documentId]/ingest/route.ts

app/(app)/dashboard/ai/startup-lawyer/page.tsx
app/(app)/dashboard/ai/startup-lawyer/[threadId]/page.tsx
app/(app)/dashboard/ai/cofounder/page.tsx
app/(app)/dashboard/ai/cofounder/[threadId]/page.tsx

components/ai/ChatLayout.tsx
components/ai/ThreadList.tsx
components/ai/ChatComposer.tsx
components/ai/ChatStream.tsx
components/ai/CitationsPanel.tsx
```

## Multi-Tenant Security
- Every DB query includes `organization_id` filter
- RLS policies enforce membership on all AI tables
- `docScope` IDs validated server-side to belong to requesting org
- System prompts include injection-resistant preambles
- Markdown rendered via `react-markdown` with restricted HTML

## Cost Controls
- Chunk size ~900 chars, overlap ~150 chars → ~200–250 tokens/chunk
- Top-K retrieval capped at 6 chunks max
- Max context budget: 3000 tokens (trimmed greedily)
- Embedding cache by SHA-256 hash of content
- Daily token limit enforced before LLM call

## TODO for Production
- [ ] Deploy Inngest for background ingestion jobs
- [ ] Switch embedding cache to Upstash Redis
- [ ] Add Upstash rate limiting on /api/ai/chat
- [ ] Enable pgvector HNSW index after data volume warrants it
- [ ] Add data retention policy (DELETE old chunks on plan downgrade)
- [ ] Enable response caching for identical prompt+context
- [ ] Full audit log integration
