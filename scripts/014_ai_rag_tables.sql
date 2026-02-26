-- ============================================================
-- AI RAG Tables
-- ============================================================

-- Add ingestion status column to documents (idempotent)
alter table public.documents
  add column if not exists storage_path text,
  add column if not exists ingest_status text not null default 'none'
    check (ingest_status in ('none','queued','processing','ready','failed')),
  add column if not exists ingest_error text,
  add column if not exists ingest_attempts integer not null default 0,
  add column if not exists chunk_count integer not null default 0;

-- document_chunks: vector store per company document
create table if not exists public.document_chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.documents(id) on delete cascade,
  organization_id uuid not null,
  chunk_index    integer not null,
  content        text not null,
  token_count_est integer not null default 0,
  embedding      vector(1536),           -- OpenAI text-embedding-3-small dimension
  content_hash   text not null,          -- SHA-256 of content, for cache hit
  metadata       jsonb not null default '{}',
  created_at     timestamptz default now(),
  unique (document_id, chunk_index)
);

alter table public.document_chunks enable row level security;

create index if not exists idx_chunks_organization_id
  on public.document_chunks (organization_id, document_id);

create index if not exists idx_chunks_content_hash
  on public.document_chunks (content_hash);

-- Vector similarity index (IVFFlat — switch to hnsw after >10k rows)
-- Created after first data load via:
--   create index idx_chunks_embedding on document_chunks
--   using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ai_threads: conversation threads
create table if not exists public.ai_threads (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  created_by      uuid not null references auth.users(id) on delete cascade,
  agent_type      text not null check (agent_type in ('startup_lawyer','cofounder')),
  title           text not null default 'New conversation',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.ai_threads enable row level security;

create index if not exists idx_ai_threads_org
  on public.ai_threads (organization_id, created_at desc);

create index if not exists idx_ai_threads_user
  on public.ai_threads (created_by);

-- ai_messages: messages per thread
create table if not exists public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.ai_threads(id) on delete cascade,
  organization_id uuid not null,
  role            text not null check (role in ('user','assistant','system')),
  content         text not null,
  token_usage     jsonb not null default '{}',  -- {prompt_tokens, completion_tokens, total_tokens}
  created_at      timestamptz default now()
);

alter table public.ai_messages enable row level security;

create index if not exists idx_ai_messages_thread
  on public.ai_messages (thread_id, created_at asc);

-- ai_citations: chunk references per assistant message
create table if not exists public.ai_citations (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references public.ai_messages(id) on delete cascade,
  chunk_id        uuid references public.document_chunks(id) on delete set null,
  document_id     uuid references public.documents(id) on delete set null,
  organization_id uuid not null,
  quote           text,
  score           double precision,
  created_at      timestamptz default now()
);

alter table public.ai_citations enable row level security;

create index if not exists idx_ai_citations_message
  on public.ai_citations (message_id);

-- ai_usage_daily: per-company daily usage tracking
create table if not exists public.ai_usage_daily (
  organization_id uuid not null,
  date            date not null,
  tokens_in       integer not null default 0,
  tokens_out      integer not null default 0,
  cost_est_usd    numeric(10,6) not null default 0,
  requests        integer not null default 0,
  primary key (organization_id, date)
);

alter table public.ai_usage_daily enable row level security;

-- plan_limits: per-plan quota configuration
create table if not exists public.plan_limits (
  plan_key                text primary key,
  daily_tokens_limit      integer not null default 50000,
  monthly_tokens_limit    integer not null default 1000000,
  max_docs                integer not null default 20,
  max_storage_mb          integer not null default 100,
  max_threads             integer not null default 50,
  agents_allowed          text[] not null default array['startup_lawyer'],
  created_at              timestamptz default now()
);

-- Seed default plans
insert into public.plan_limits (plan_key, daily_tokens_limit, monthly_tokens_limit, max_docs, max_storage_mb, max_threads, agents_allowed)
values
  ('free',       20000,   200000,   5,   25,  10, array['startup_lawyer']),
  ('starter',    80000,   1500000,  25,  200, 100, array['startup_lawyer','cofounder']),
  ('pro',        300000,  6000000,  100, 1000, 500, array['startup_lawyer','cofounder']),
  ('enterprise', 1000000, 20000000, 500, 5000, 2000, array['startup_lawyer','cofounder'])
on conflict (plan_key) do update set
  daily_tokens_limit   = excluded.daily_tokens_limit,
  monthly_tokens_limit = excluded.monthly_tokens_limit,
  max_docs             = excluded.max_docs,
  max_storage_mb       = excluded.max_storage_mb,
  max_threads          = excluded.max_threads,
  agents_allowed       = excluded.agents_allowed;
