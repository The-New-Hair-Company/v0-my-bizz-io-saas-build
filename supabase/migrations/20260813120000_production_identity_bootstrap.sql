begin;

create table if not exists public.user_profiles (
  clerk_user_id text primary key,
  primary_email text,
  display_name text not null,
  image_url text,
  status text not null default 'active' check (status in ('active', 'suspended', 'disabled')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_administrators (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique references public.user_profiles(clerk_user_id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  provisioned_email text,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  provisioned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists application_administrators_one_primary_idx
  on public.application_administrators (is_primary)
  where is_primary;
create index if not exists application_administrators_organization_idx
  on public.application_administrators (organization_id);
create index if not exists members_user_organization_idx
  on public.members (user_id, organization_id);

alter table public.user_profiles enable row level security;
alter table public.application_administrators enable row level security;

drop policy if exists user_profiles_own_select on public.user_profiles;
create policy user_profiles_own_select on public.user_profiles for select to authenticated
  using (clerk_user_id = private.current_actor_id());

revoke all on public.user_profiles, public.application_administrators from public, anon, authenticated;
grant select on public.user_profiles to authenticated;
grant all privileges on public.user_profiles, public.application_administrators to service_role;

create or replace function public.bootstrap_application_admin(
  p_clerk_user_id text,
  p_email text,
  p_display_name text,
  p_image_url text default null
)
returns table (provisioned_organization_id uuid, is_application_admin boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.application_administrators%rowtype;
  v_organization_id uuid;
begin
  if nullif(trim(p_clerk_user_id), '') is null then
    raise exception 'A Clerk user ID is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('mybizz.application_admin.bootstrap', 0));

  select * into v_existing
  from public.application_administrators
  where is_primary
  order by provisioned_at asc
  limit 1;

  if found then
    return query select
      v_existing.organization_id,
      (v_existing.clerk_user_id = p_clerk_user_id and v_existing.status = 'active');
    return;
  end if;

  select id into v_organization_id
  from public.organizations
  where source = 'internal'
  order by created_at asc
  limit 1;

  if v_organization_id is null then
    insert into public.organizations (
      name, slug, lifecycle_stage, account_status, source, primary_contact_email,
      created_by, onboarding_progress, health_score, plan
    ) values (
      'MyBizz Agency', 'mybizz-agency', 'active', 'active', 'internal', lower(p_email),
      p_clerk_user_id, 100, 100, 'enterprise'
    )
    returning id into v_organization_id;
  end if;

  insert into public.user_profiles (
    clerk_user_id, primary_email, display_name, image_url, status, last_seen_at, updated_at
  ) values (
    p_clerk_user_id, lower(p_email), coalesce(nullif(trim(p_display_name), ''), 'MyBizz administrator'),
    p_image_url, 'active', now(), now()
  )
  on conflict (clerk_user_id) do update set
    primary_email = excluded.primary_email,
    display_name = excluded.display_name,
    image_url = excluded.image_url,
    status = 'active',
    last_seen_at = now(),
    updated_at = now();

  insert into public.application_administrators (
    clerk_user_id, organization_id, provisioned_email, is_primary, status
  ) values (
    p_clerk_user_id, v_organization_id, lower(p_email), true, 'active'
  );

  insert into public.members (organization_id, user_id, role)
  values (v_organization_id, p_clerk_user_id, 'owner')
  on conflict (organization_id, user_id) do update set role = 'owner', updated_at = now();

  insert into public.organization_subscriptions (organization_id, plan_key, status, provider)
  values (v_organization_id, 'enterprise', 'active', 'manual')
  on conflict (organization_id) do update set
    plan_key = 'enterprise', status = 'active', updated_at = now();

  return query select v_organization_id, true;
end;
$$;

revoke all on function public.bootstrap_application_admin(text, text, text, text) from public, anon, authenticated;
grant execute on function public.bootstrap_application_admin(text, text, text, text) to service_role;

commit;
