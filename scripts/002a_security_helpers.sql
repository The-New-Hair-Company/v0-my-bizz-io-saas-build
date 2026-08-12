-- Internal authorization helpers used by RLS policies.
-- Keep these outside exposed schemas because SECURITY DEFINER bypasses RLS.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_organization_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.members
    where organization_id = org_id
      and user_id = (select auth.uid())
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
    select 1
    from public.members
    where organization_id = org_id
      and user_id = (select auth.uid())
      and role in ('admin', 'owner')
  );
$$;

-- Newsletter data is currently global rather than organization-scoped.
-- Restrict it to users who own or administer at least one organization.
create or replace function private.is_global_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.members
    where user_id = (select auth.uid())
      and role in ('admin', 'owner')
  );
$$;

revoke execute on function private.is_organization_member(uuid) from public, anon, authenticated, service_role;
revoke execute on function private.is_organization_admin(uuid) from public, anon, authenticated, service_role;
revoke execute on function private.is_global_admin() from public, anon, authenticated, service_role;
