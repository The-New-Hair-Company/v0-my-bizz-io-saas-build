-- ============================================================
-- RLS Policies for AI RAG tables
-- ============================================================

-- document_chunks — company members only
create policy "Members can view their org chunks"
  on public.document_chunks for select
  using (public.is_organization_member(organization_id));

create policy "Members can insert chunks for their org"
  on public.document_chunks for insert
  with check (public.is_organization_member(organization_id));

create policy "Members can update chunks for their org"
  on public.document_chunks for update
  using (public.is_organization_member(organization_id));

create policy "Members can delete chunks for their org"
  on public.document_chunks for delete
  using (public.is_organization_member(organization_id));

-- ai_threads
create policy "Members can view their org threads"
  on public.ai_threads for select
  using (public.is_organization_member(organization_id));

create policy "Members can create threads in their org"
  on public.ai_threads for insert
  with check (
    public.is_organization_member(organization_id) and
    auth.uid() = created_by
  );

create policy "Users can update their own threads"
  on public.ai_threads for update
  using (auth.uid() = created_by);

create policy "Users can delete their own threads"
  on public.ai_threads for delete
  using (auth.uid() = created_by);

-- ai_messages
create policy "Members can view messages in their org threads"
  on public.ai_messages for select
  using (public.is_organization_member(organization_id));

create policy "Members can insert messages in their org"
  on public.ai_messages for insert
  with check (public.is_organization_member(organization_id));

-- ai_citations
create policy "Members can view citations in their org"
  on public.ai_citations for select
  using (public.is_organization_member(organization_id));

create policy "Members can insert citations in their org"
  on public.ai_citations for insert
  with check (public.is_organization_member(organization_id));

-- ai_usage_daily — admins can view; system inserts/upserts
create policy "Admins can view usage for their org"
  on public.ai_usage_daily for select
  using (public.is_organization_member(organization_id));

create policy "System can upsert usage"
  on public.ai_usage_daily for insert
  with check (true);

create policy "System can update usage"
  on public.ai_usage_daily for update
  using (true);

-- plan_limits — everyone can read (plan configs are public)
alter table public.plan_limits enable row level security;

create policy "Anyone can read plan limits"
  on public.plan_limits for select
  using (true);
