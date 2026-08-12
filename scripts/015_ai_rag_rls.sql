-- ============================================================
-- RLS Policies for AI RAG tables
-- ============================================================

-- document_chunks — company members only
create policy "Members can view their org chunks"
  on public.document_chunks for select to authenticated
  using (private.is_organization_member(organization_id));

create policy "Members can insert chunks for their org"
  on public.document_chunks for insert to authenticated
  with check (
    private.is_organization_member(organization_id) and
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.organization_id = document_chunks.organization_id
    )
  );

create policy "Members can update chunks for their org"
  on public.document_chunks for update to authenticated
  using (private.is_organization_member(organization_id))
  with check (
    private.is_organization_member(organization_id) and
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.organization_id = document_chunks.organization_id
    )
  );

create policy "Members can delete chunks for their org"
  on public.document_chunks for delete to authenticated
  using (private.is_organization_member(organization_id));

-- ai_threads
create policy "Members can view their org threads"
  on public.ai_threads for select to authenticated
  using (private.is_organization_member(organization_id));

create policy "Members can create threads in their org"
  on public.ai_threads for insert to authenticated
  with check (
    private.is_organization_member(organization_id) and
    (select auth.uid()) = created_by
  );

create policy "Users can update their own threads"
  on public.ai_threads for update to authenticated
  using ((select auth.uid()) = created_by)
  with check (
    (select auth.uid()) = created_by and
    private.is_organization_member(organization_id)
  );

create policy "Users can delete their own threads"
  on public.ai_threads for delete to authenticated
  using ((select auth.uid()) = created_by);

-- ai_messages
create policy "Members can view messages in their org threads"
  on public.ai_messages for select to authenticated
  using (private.is_organization_member(organization_id));

create policy "Members can insert messages in their org"
  on public.ai_messages for insert to authenticated
  with check (
    private.is_organization_member(organization_id) and
    exists (
      select 1 from public.ai_threads
      where ai_threads.id = ai_messages.thread_id
        and ai_threads.organization_id = ai_messages.organization_id
    )
  );

-- ai_citations
create policy "Members can view citations in their org"
  on public.ai_citations for select to authenticated
  using (private.is_organization_member(organization_id));

create policy "Members can insert citations in their org"
  on public.ai_citations for insert to authenticated
  with check (
    private.is_organization_member(organization_id) and
    exists (
      select 1 from public.ai_messages
      where ai_messages.id = ai_citations.message_id
        and ai_messages.organization_id = ai_citations.organization_id
    ) and
    (
      ai_citations.chunk_id is null or exists (
        select 1 from public.document_chunks
        where document_chunks.id = ai_citations.chunk_id
          and document_chunks.organization_id = ai_citations.organization_id
      )
    ) and
    (
      ai_citations.document_id is null or exists (
        select 1 from public.documents
        where documents.id = ai_citations.document_id
          and documents.organization_id = ai_citations.organization_id
      )
    )
  );

-- ai_usage_daily — admins can view; system inserts/upserts
create policy "Admins can view usage for their org"
  on public.ai_usage_daily for select to authenticated
  using (private.is_organization_member(organization_id));

-- plan_limits — everyone can read (plan configs are public)
alter table public.plan_limits enable row level security;

create policy "Anyone can read plan limits"
  on public.plan_limits for select to anon, authenticated
  using (true);
