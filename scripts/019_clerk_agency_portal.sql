-- ============================================================
-- Clerk identity + agency account portal
-- ============================================================

begin;

-- Clerk user ids are strings (for example user_2abc...), not UUIDs. Remove
-- legacy auth.users foreign keys before converting identity columns.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'f'
      and confrelid = 'auth.users'::regclass
      and connamespace = 'public'::regnamespace
  loop
    execute format(
      'alter table %s drop constraint %I',
      constraint_row.table_name,
      constraint_row.conname
    );
  end loop;
end $$;

-- Policies depend on the old UUID identity columns. Recreate all public
-- policies below after the identity migration.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end $$;

drop policy if exists "Members can upload to their company prefix" on storage.objects;
drop policy if exists "Members can read their company files" on storage.objects;
drop policy if exists "Members can update their company files" on storage.objects;
drop policy if exists "Owners or admins can delete company files" on storage.objects;

drop trigger if exists on_user_signup_onboarding on auth.users;
drop function if exists private.handle_new_user_onboarding();

alter table public.members alter column user_id type text using user_id::text;
alter table public.chats alter column created_by type text using created_by::text;
alter table public.documents alter column uploaded_by type text using uploaded_by::text;
alter table public.filings alter column created_by type text using created_by::text;
alter table public.tasks alter column assigned_to type text using assigned_to::text;
alter table public.tasks alter column created_by type text using created_by::text;
alter table public.extracted_facts alter column verified_by type text using verified_by::text;
alter table public.notifications alter column user_id type text using user_id::text;
alter table public.audit_logs alter column user_id type text using user_id::text;
alter table public.ai_threads alter column created_by type text using created_by::text;
alter table public.newsletter_campaigns alter column created_by type text using created_by::text;
alter table public.newsletter_campaign_versions alter column created_by type text using created_by::text;

alter table public.organizations
  add column if not exists slug text,
  add column if not exists lifecycle_stage text not null default 'lead',
  add column if not exists account_status text not null default 'active',
  add column if not exists primary_contact_name text,
  add column if not exists primary_contact_email text,
  add column if not exists primary_contact_phone text,
  add column if not exists industry text,
  add column if not exists company_size text,
  add column if not exists service_lines text[] not null default '{}',
  add column if not exists estimated_value numeric(12,2),
  add column if not exists health_score integer not null default 75,
  add column if not exists onboarding_progress integer not null default 0,
  add column if not exists source text not null default 'manual',
  add column if not exists last_activity_at timestamptz default now(),
  add column if not exists created_by text,
  add column if not exists clerk_organization_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_lifecycle_stage_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations add constraint organizations_lifecycle_stage_check
      check (lifecycle_stage in ('lead','discovery','proposal','onboarding','active','paused','churned'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_account_status_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations add constraint organizations_account_status_check
      check (account_status in ('active','attention','at_risk','paused','archived'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_health_score_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations add constraint organizations_health_score_check
      check (health_score between 0 and 100);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_onboarding_progress_check'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations add constraint organizations_onboarding_progress_check
      check (onboarding_progress between 0 and 100);
  end if;
end $$;

create unique index if not exists idx_organizations_slug
  on public.organizations(slug) where slug is not null;
create unique index if not exists idx_organizations_clerk_org
  on public.organizations(clerk_organization_id) where clerk_organization_id is not null;
create index if not exists idx_organizations_portfolio
  on public.organizations(lifecycle_stage, account_status, last_activity_at desc);
create index if not exists idx_organizations_contact_email
  on public.organizations(lower(primary_contact_email));

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reference_code text not null unique,
  contact_name text not null,
  email text not null,
  phone text,
  company_name text not null,
  current_website text,
  company_size text,
  industry text,
  project_types text[] not null default '{}',
  budget_range text,
  target_launch text,
  goals text not null,
  pain_points text,
  design_direction text,
  competitors text,
  required_integrations text[] not null default '{}',
  content_readiness text,
  notes text,
  marketing_consent boolean not null default false,
  privacy_accepted boolean not null,
  status text not null default 'new',
  assigned_to text,
  metadata jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id text,
  activity_type text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  project_type text not null,
  status text not null default 'discovery',
  progress integer not null default 0 check (progress between 0 and 100),
  budget numeric(12,2),
  target_launch date,
  owner_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('discovery','strategy','design','development','qa','launch','support','complete','on_hold'))
);

alter table public.intake_submissions enable row level security;
alter table public.account_activity enable row level security;
alter table public.client_projects enable row level security;

create index if not exists idx_intake_org_status
  on public.intake_submissions(organization_id, status, submitted_at desc);
create index if not exists idx_intake_assigned_status
  on public.intake_submissions(assigned_to, status, submitted_at desc);
create index if not exists idx_activity_org_created
  on public.account_activity(organization_id, created_at desc);
create index if not exists idx_projects_org_status
  on public.client_projects(organization_id, status, updated_at desc);
create index if not exists idx_projects_owner
  on public.client_projects(owner_id);

create or replace function private.current_actor_id()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif((select auth.jwt()->>'sub'), ''),
    (select auth.uid())::text
  );
$$;

create or replace function private.is_organization_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where organization_id = org_id
      and user_id = private.current_actor_id()
  );
$$;

create or replace function private.is_organization_admin(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where organization_id = org_id
      and user_id = private.current_actor_id()
      and role in ('owner','admin')
  );
$$;

create or replace function private.is_global_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.members
    where user_id = private.current_actor_id()
      and role in ('owner','admin')
  );
$$;

revoke all on function private.current_actor_id() from public, anon;
revoke all on function private.is_organization_member(uuid) from public, anon;
revoke all on function private.is_organization_admin(uuid) from public, anon;
revoke all on function private.is_global_admin() from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.current_actor_id() to authenticated;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.is_organization_admin(uuid) to authenticated;
grant execute on function private.is_global_admin() to authenticated;

-- Tenant and identity policies.
create policy organizations_select on public.organizations for select to authenticated
  using ((select private.is_organization_member(id)));
create policy organizations_update on public.organizations for update to authenticated
  using ((select private.is_organization_admin(id)))
  with check ((select private.is_organization_admin(id)));
create policy organizations_delete on public.organizations for delete to authenticated
  using ((select private.is_organization_admin(id)));

create policy members_select on public.members for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy members_insert on public.members for insert to authenticated
  with check ((select private.is_organization_admin(organization_id)));
create policy members_update on public.members for update to authenticated
  using ((select private.is_organization_admin(organization_id)))
  with check ((select private.is_organization_admin(organization_id)));
create policy members_delete on public.members for delete to authenticated
  using ((select private.is_organization_admin(organization_id)));

create policy chats_tenant_all on public.chats for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)) and created_by = private.current_actor_id());
create policy messages_tenant_all on public.messages for all to authenticated
  using (exists (select 1 from public.chats c where c.id = messages.chat_id and private.is_organization_member(c.organization_id)))
  with check (exists (select 1 from public.chats c where c.id = messages.chat_id and private.is_organization_member(c.organization_id)));
create policy documents_tenant_all on public.documents for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)) and uploaded_by = private.current_actor_id());
create policy filings_tenant_all on public.filings for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)) and created_by = private.current_actor_id());
create policy tasks_tenant_all on public.tasks for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)) and created_by = private.current_actor_id());
create policy extracted_facts_tenant_all on public.extracted_facts for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));
create policy notifications_own_all on public.notifications for all to authenticated
  using (user_id = private.current_actor_id())
  with check (user_id = private.current_actor_id() and private.is_organization_member(organization_id));
create policy audit_logs_admin_select on public.audit_logs for select to authenticated
  using ((select private.is_organization_admin(organization_id)));

create policy chunks_tenant_all on public.document_chunks for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));
create policy ai_threads_tenant_all on public.ai_threads for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)) and created_by = private.current_actor_id());
create policy ai_messages_tenant_all on public.ai_messages for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));
create policy ai_citations_tenant_all on public.ai_citations for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));
create policy ai_usage_tenant_select on public.ai_usage_daily for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy ai_usage_tenant_insert on public.ai_usage_daily for insert to authenticated
  with check ((select private.is_organization_member(organization_id)));
create policy ai_usage_tenant_update on public.ai_usage_daily for update to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));
create policy plan_limits_public_select on public.plan_limits for select to anon, authenticated using (true);

create policy intakes_tenant_select on public.intake_submissions for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy intakes_admin_update on public.intake_submissions for update to authenticated
  using ((select private.is_organization_admin(organization_id)))
  with check ((select private.is_organization_admin(organization_id)));
create policy activity_tenant_select on public.account_activity for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy activity_tenant_insert on public.account_activity for insert to authenticated
  with check ((select private.is_organization_member(organization_id)) and actor_id = private.current_actor_id());
create policy projects_tenant_all on public.client_projects for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));

-- Newsletter remains an agency-admin surface, with sent issues public.
create policy newsletter_subscribers_admin on public.newsletter_subscribers for all to authenticated
  using ((select private.is_global_admin())) with check ((select private.is_global_admin()));
create policy newsletter_lists_admin on public.newsletter_lists for all to authenticated
  using ((select private.is_global_admin())) with check ((select private.is_global_admin()));
create policy newsletter_memberships_admin on public.newsletter_list_memberships for all to authenticated
  using ((select private.is_global_admin())) with check ((select private.is_global_admin()));
create policy newsletter_campaigns_admin on public.newsletter_campaigns for all to authenticated
  using ((select private.is_global_admin())) with check ((select private.is_global_admin()));
create policy newsletter_versions_admin on public.newsletter_campaign_versions for all to authenticated
  using ((select private.is_global_admin())) with check ((select private.is_global_admin()));
create policy newsletter_jobs_admin on public.newsletter_send_jobs for select to authenticated
  using ((select private.is_global_admin()));
create policy newsletter_events_admin on public.newsletter_email_events for select to authenticated
  using ((select private.is_global_admin()));
create policy newsletter_suppression_admin on public.newsletter_suppression_list for all to authenticated
  using ((select private.is_global_admin())) with check ((select private.is_global_admin()));
create policy newsletter_consent_admin on public.newsletter_consent_events for select to authenticated
  using ((select private.is_global_admin()));
create policy newsletter_campaigns_public on public.newsletter_campaigns for select to anon
  using (status = 'sent');
create policy newsletter_versions_public on public.newsletter_campaign_versions for select to anon
  using (exists (select 1 from public.newsletter_campaigns c where c.id = campaign_id and c.status = 'sent'));

-- Clerk-authenticated clients receive only the tables needed by the portal.
grant select, update on public.organizations to authenticated;
grant select, insert, update, delete on public.members, public.chats, public.messages,
  public.documents, public.filings, public.tasks, public.extracted_facts,
  public.notifications, public.document_chunks, public.ai_threads,
  public.ai_messages, public.ai_citations, public.client_projects to authenticated;
grant select on public.audit_logs, public.plan_limits,
  public.intake_submissions, public.account_activity to authenticated;
grant select, insert, update on public.ai_usage_daily to authenticated;
grant update on public.intake_submissions to authenticated;
grant insert on public.account_activity to authenticated;
grant all privileges on public.intake_submissions, public.account_activity,
  public.client_projects to service_role;

-- Storage policies use the same Clerk subject-to-membership mapping.
drop policy if exists "Members can upload to their company prefix" on storage.objects;
drop policy if exists "Members can read their company files" on storage.objects;
drop policy if exists "Members can update their company files" on storage.objects;
drop policy if exists "Owners or admins can delete company files" on storage.objects;
create policy company_documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'company-documents' and private.is_organization_member((storage.foldername(name))[2]::uuid));
create policy company_documents_select on storage.objects for select to authenticated
  using (bucket_id = 'company-documents' and private.is_organization_member((storage.foldername(name))[2]::uuid));
create policy company_documents_update on storage.objects for update to authenticated
  using (bucket_id = 'company-documents' and private.is_organization_member((storage.foldername(name))[2]::uuid))
  with check (bucket_id = 'company-documents' and private.is_organization_member((storage.foldername(name))[2]::uuid));
create policy company_documents_delete on storage.objects for delete to authenticated
  using (bucket_id = 'company-documents' and private.is_organization_admin((storage.foldername(name))[2]::uuid));

commit;
