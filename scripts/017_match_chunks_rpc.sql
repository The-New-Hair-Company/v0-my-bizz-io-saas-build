-- ============================================================
-- Migration 017: match_chunks RPC + atomic AI usage increment
-- ============================================================

-- -----------------------------------------------
-- match_chunks: vector similarity search scoped to one org
-- -----------------------------------------------
create or replace function public.match_chunks(
  query_embedding vector(1536),
  org_id          uuid,
  match_count     int     default 6,
  match_threshold float   default 0.55
)
returns table (
  id           uuid,
  document_id  uuid,
  chunk_index  int,
  content      text,
  metadata     jsonb,
  score        float
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::float as score
  from public.document_chunks dc
  where
    dc.organization_id = org_id
    and dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- Allow authenticated users to call this function (RLS on the
-- underlying table still restricts which rows are visible)
grant execute on function public.match_chunks(vector, uuid, int, float)
  to authenticated;

-- -----------------------------------------------
-- increment_ai_usage: atomic upsert to avoid race conditions
-- when multiple concurrent AI requests record usage at the same time.
-- -----------------------------------------------
create or replace function public.increment_ai_usage(
  p_org_id   uuid,
  p_date     date,
  p_tokens_in  integer,
  p_tokens_out integer,
  p_cost     numeric,
  p_requests integer default 1
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage_daily
    (organization_id, date, tokens_in, tokens_out, cost_est_usd, requests)
  values
    (p_org_id, p_date, p_tokens_in, p_tokens_out, p_cost, p_requests)
  on conflict (organization_id, date)
  do update set
    tokens_in    = ai_usage_daily.tokens_in    + excluded.tokens_in,
    tokens_out   = ai_usage_daily.tokens_out   + excluded.tokens_out,
    cost_est_usd = ai_usage_daily.cost_est_usd + excluded.cost_est_usd,
    requests     = ai_usage_daily.requests     + excluded.requests;
$$;

grant execute on function public.increment_ai_usage(uuid, date, integer, integer, numeric, integer)
  to authenticated, service_role;
