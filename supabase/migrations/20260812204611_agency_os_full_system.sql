-- Agency OS: preferences, team access, integrations and token-free grounded retrieval.
-- Clerk is the identity provider; every tenant-facing table is protected by RLS.

begin;

create table if not exists public.member_preferences (
  user_id text primary key,
  active_organization_id uuid references public.organizations(id) on delete set null,
  accent_color text not null default '#ff6600',
  theme_mode text not null default 'light' check (theme_mode in ('light', 'dark', 'system')),
  compact_mode boolean not null default false,
  email_notifications boolean not null default true,
  deadline_notifications boolean not null default true,
  weekly_digest boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists team_invites_one_pending_email
  on public.team_invites (organization_id, lower(email))
  where status = 'pending';
create index if not exists team_invites_org_status
  on public.team_invites (organization_id, status, created_at desc);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  display_name text not null,
  status text not null default 'available' check (status in ('available', 'connected', 'attention', 'disabled')),
  configuration jsonb not null default '{}',
  connected_by text,
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create index if not exists integrations_org_status
  on public.integrations (organization_id, status, provider);

create table if not exists public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  knowledge_key text not null unique,
  organization_id uuid references public.organizations(id) on delete cascade,
  visibility text not null default 'tenant' check (visibility in ('public', 'tenant')),
  category text not null,
  title text not null,
  content text not null,
  keywords text[] not null default '{}',
  source_url text,
  active boolean not null default true,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((visibility = 'public' and organization_id is null) or (visibility = 'tenant' and organization_id is not null))
);

create index if not exists knowledge_entries_search_idx
  on public.knowledge_entries using gin (search_vector);
create index if not exists knowledge_entries_tenant_idx
  on public.knowledge_entries (organization_id, category, active);

create table if not exists public.assistant_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  message_id uuid references public.ai_messages(id) on delete cascade,
  user_id text not null,
  rating smallint not null check (rating in (-1, 1)),
  note text,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.documents
  add column if not exists storage_path text,
  add column if not exists ingest_status text not null default 'none',
  add column if not exists ingest_attempts integer not null default 0,
  add column if not exists ingest_error text,
  add column if not exists chunk_count integer not null default 0;

alter table public.documents drop constraint if exists documents_ingest_status_check;
alter table public.documents add constraint documents_ingest_status_check
  check (ingest_status in ('none', 'queued', 'pending', 'processing', 'ready', 'failed'));

alter table public.document_chunks
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('english', coalesce(content, ''))
  ) stored;

create index if not exists document_chunks_search_idx
  on public.document_chunks using gin (search_vector);
create index if not exists document_chunks_org_document_idx
  on public.document_chunks (organization_id, document_id, chunk_index);

alter table public.member_preferences enable row level security;
alter table public.team_invites enable row level security;
alter table public.integrations enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.assistant_feedback enable row level security;

drop policy if exists member_preferences_own on public.member_preferences;
create policy member_preferences_own on public.member_preferences for all to authenticated
  using (user_id = private.current_actor_id())
  with check (
    user_id = private.current_actor_id()
    and (
      active_organization_id is null
      or private.is_organization_member(active_organization_id)
    )
  );

drop policy if exists team_invites_admin_select on public.team_invites;
drop policy if exists team_invites_admin_insert on public.team_invites;
drop policy if exists team_invites_admin_update on public.team_invites;
drop policy if exists team_invites_admin_delete on public.team_invites;
create policy team_invites_admin_select on public.team_invites for select to authenticated
  using (private.is_organization_admin(organization_id));
create policy team_invites_admin_insert on public.team_invites for insert to authenticated
  with check (private.is_organization_admin(organization_id) and invited_by = private.current_actor_id());
create policy team_invites_admin_update on public.team_invites for update to authenticated
  using (private.is_organization_admin(organization_id))
  with check (private.is_organization_admin(organization_id));
create policy team_invites_admin_delete on public.team_invites for delete to authenticated
  using (private.is_organization_admin(organization_id));

drop policy if exists integrations_tenant_select on public.integrations;
drop policy if exists integrations_admin_insert on public.integrations;
drop policy if exists integrations_admin_update on public.integrations;
drop policy if exists integrations_admin_delete on public.integrations;
create policy integrations_tenant_select on public.integrations for select to authenticated
  using (private.is_organization_member(organization_id));
create policy integrations_admin_insert on public.integrations for insert to authenticated
  with check (private.is_organization_admin(organization_id));
create policy integrations_admin_update on public.integrations for update to authenticated
  using (private.is_organization_admin(organization_id))
  with check (private.is_organization_admin(organization_id));
create policy integrations_admin_delete on public.integrations for delete to authenticated
  using (private.is_organization_admin(organization_id));

drop policy if exists knowledge_public_select on public.knowledge_entries;
drop policy if exists knowledge_tenant_select on public.knowledge_entries;
drop policy if exists knowledge_tenant_insert on public.knowledge_entries;
drop policy if exists knowledge_tenant_update on public.knowledge_entries;
drop policy if exists knowledge_tenant_delete on public.knowledge_entries;
create policy knowledge_public_select on public.knowledge_entries for select to anon
  using (visibility = 'public' and active);
create policy knowledge_tenant_select on public.knowledge_entries for select to authenticated
  using (
    (visibility = 'public' and active)
    or (organization_id is not null and private.is_organization_member(organization_id))
  );
create policy knowledge_tenant_insert on public.knowledge_entries for insert to authenticated
  with check (
    organization_id is not null
    and visibility = 'tenant'
    and private.is_organization_admin(organization_id)
  );
create policy knowledge_tenant_update on public.knowledge_entries for update to authenticated
  using (organization_id is not null and private.is_organization_admin(organization_id))
  with check (organization_id is not null and visibility = 'tenant' and private.is_organization_admin(organization_id));
create policy knowledge_tenant_delete on public.knowledge_entries for delete to authenticated
  using (organization_id is not null and private.is_organization_admin(organization_id));

drop policy if exists assistant_feedback_tenant_all on public.assistant_feedback;
create policy assistant_feedback_tenant_all on public.assistant_feedback for all to authenticated
  using (private.is_organization_member(organization_id) and user_id = private.current_actor_id())
  with check (private.is_organization_member(organization_id) and user_id = private.current_actor_id());

create or replace function public.search_grounded_knowledge(
  query_text text,
  p_organization_id uuid default null,
  match_count integer default 6
)
returns table (
  source_kind text,
  source_id uuid,
  document_id uuid,
  title text,
  content text,
  score real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select websearch_to_tsquery('english', nullif(trim(query_text), '')) as value
  ), candidates as (
    select
      'document'::text as source_kind,
      dc.id as source_id,
      dc.document_id,
      d.title,
      dc.content,
      ts_rank_cd(dc.search_vector, query.value)::real as score
    from public.document_chunks dc
    join public.documents d on d.id = dc.document_id
    cross join query
    where p_organization_id is not null
      and dc.organization_id = p_organization_id
      and query.value is not null
      and dc.search_vector @@ query.value

    union all

    select
      'knowledge'::text,
      ke.id,
      null::uuid,
      ke.title,
      ke.content,
      ts_rank_cd(ke.search_vector, query.value)::real
    from public.knowledge_entries ke
    cross join query
    where ke.active
      and query.value is not null
      and ke.search_vector @@ query.value
      and (
        (ke.visibility = 'public' and ke.organization_id is null)
        or (p_organization_id is not null and ke.organization_id = p_organization_id)
      )
  )
  select * from candidates
  order by score desc, title asc
  limit greatest(1, least(match_count, 10));
$$;

revoke all on function public.search_grounded_knowledge(text, uuid, integer) from public;
grant execute on function public.search_grounded_knowledge(text, uuid, integer) to anon, authenticated;

grant select, insert, update, delete on public.member_preferences to authenticated;
grant select, insert, update, delete on public.team_invites to authenticated;
grant select, insert, update, delete on public.integrations to authenticated;
grant select on public.knowledge_entries to anon, authenticated;
grant insert, update, delete on public.knowledge_entries to authenticated;
grant select, insert, update, delete on public.assistant_feedback to authenticated;
-- The public retrieval RPC contains a document branch. Postgres checks table
-- privileges for the whole function even when p_organization_id is null.
-- RLS has no anon policies on either table, so these grants expose zero rows
-- while allowing the public-knowledge branch to execute.
grant select on public.documents, public.document_chunks to anon;
grant all privileges on public.member_preferences, public.team_invites, public.integrations,
  public.knowledge_entries, public.assistant_feedback to service_role;

insert into public.knowledge_entries
  (knowledge_key, organization_id, visibility, category, title, content, keywords, source_url)
values
  (
    'public-intake-workflow', null, 'public', 'platform', 'How the MyBizz intake works',
    'The MyBizz discovery wizard captures company details, project goals, budget range, target launch, integrations, design direction and content readiness. A submission creates a secure client account and a structured brief for the agency team to review.',
    array['intake','brief','wizard','project','start'], '/start'
  ),
  (
    'public-agency-os', null, 'public', 'platform', 'Agency OS workspace',
    'Agency OS brings client accounts, projects, tasks, deadlines, documents, team access and grounded assistants into one workspace. Signed-in users only see organizations assigned to their Clerk identity.',
    array['dashboard','agency','workspace','clients','security'], '/product'
  ),
  (
    'public-security', null, 'public', 'security', 'Tenant security and access',
    'MyBizz uses Clerk for authentication and Supabase Row Level Security for authorization. Every client record carries an organization identifier and database policies verify membership before data is returned or changed.',
    array['security','tenant','clerk','supabase','privacy'], '/product'
  ),
  (
    'public-grounded-assistant', null, 'public', 'ai', 'Grounded assistants without token spend',
    'The assistant retrieves approved knowledge and client document excerpts, ranks the closest sources, and produces a structured response with citations. The current retrieval mode uses Postgres full-text ranking and deterministic response patterns, so it does not consume paid language-model tokens.',
    array['assistant','ai','rag','documents','citations','tokens'], '/product'
  ),
  (
    'public-delivery', null, 'public', 'delivery', 'From brief to launch',
    'After an intake is reviewed, the team can open delivery projects, create accountable tasks, monitor deadlines, attach documents and track activity. Portfolio health and onboarding progress make risk visible from the command centre.',
    array['delivery','projects','tasks','deadlines','launch'], '/product'
  )
on conflict (knowledge_key) do update set
  title = excluded.title,
  content = excluded.content,
  keywords = excluded.keywords,
  source_url = excluded.source_url,
  active = true,
  updated_at = now();

commit;
