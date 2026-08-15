-- Reduce portal request waterfalls and make the persisted application
-- administrator a member of every customer tenant.

begin;

create index if not exists members_user_created_organization_idx
  on public.members (user_id, created_at, organization_id) include (role);
create index if not exists member_preferences_active_organization_idx
  on public.member_preferences (active_organization_id)
  where active_organization_id is not null;
create index if not exists organizations_customer_created_idx
  on public.organizations (created_at desc)
  where source is distinct from 'internal';
create index if not exists application_administrators_active_user_idx
  on public.application_administrators (clerk_user_id)
  where status = 'active';
create index if not exists assistant_feedback_message_idx
  on public.assistant_feedback (message_id)
  where message_id is not null;
create index if not exists billing_webhook_events_organization_idx
  on public.billing_webhook_events (organization_id)
  where organization_id is not null;

create or replace function private.assign_application_admin_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'active' then return new; end if;

  insert into public.members (organization_id, user_id, role)
  select organization.id, new.clerk_user_id, 'owner'
  from public.organizations as organization
  where organization.source is distinct from 'internal'
  on conflict (organization_id, user_id) do update set
    role = 'owner',
    updated_at = now();

  return new;
end;
$$;

revoke all on function private.assign_application_admin_accounts() from public, anon, authenticated;

create or replace function private.assign_customer_account_to_application_admins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source is not distinct from 'internal' then return new; end if;

  insert into public.members (organization_id, user_id, role)
  select new.id, administrator.clerk_user_id, 'owner'
  from public.application_administrators as administrator
  where administrator.status = 'active'
  on conflict (organization_id, user_id) do update set
    role = 'owner',
    updated_at = now();

  return new;
end;
$$;

revoke all on function private.assign_customer_account_to_application_admins() from public, anon, authenticated;

drop trigger if exists customer_account_assign_application_admins on public.organizations;
create trigger customer_account_assign_application_admins
  after insert or update of source on public.organizations
  for each row execute function private.assign_customer_account_to_application_admins();

insert into public.members (organization_id, user_id, role)
select organization.id, administrator.clerk_user_id, 'owner'
from public.organizations as organization
cross join public.application_administrators as administrator
where organization.source is distinct from 'internal'
  and administrator.status = 'active'
on conflict (organization_id, user_id) do update set
  role = 'owner',
  updated_at = now();

create or replace function public.get_portal_identity(p_clerk_user_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'profile', (
      select jsonb_build_object(
        'primary_email', profile.primary_email,
        'display_name', profile.display_name,
        'image_url', profile.image_url
      )
      from public.user_profiles as profile
      where profile.clerk_user_id = p_clerk_user_id
        and profile.status = 'active'
    ),
    'isAdmin', exists (
      select 1
      from public.application_administrators as administrator
      where administrator.clerk_user_id = p_clerk_user_id
        and administrator.status = 'active'
    ),
    'hasMembership', exists (
      select 1
      from public.members as membership
      where membership.user_id = p_clerk_user_id
    )
  );
$$;

revoke all on function public.get_portal_identity(text) from public, anon, authenticated;
grant execute on function public.get_portal_identity(text) to service_role;

create or replace function public.get_portal_shell(p_clerk_user_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with actor_memberships as (
    select
      m.organization_id,
      m.role,
      m.created_at,
      o.name,
      o.slug,
      o.lifecycle_stage,
      o.source,
      o.plan
    from public.members as m
    join public.organizations as o on o.id = m.organization_id
    where m.user_id = p_clerk_user_id
  ), preferences as (
    select
      mp.active_organization_id,
      mp.accent_color,
      mp.compact_mode
    from public.member_preferences as mp
    where mp.user_id = p_clerk_user_id
  ), active_account as (
    select membership.*
    from actor_memberships as membership
    left join preferences on true
    order by
      (membership.organization_id = preferences.active_organization_id) desc nulls last,
      (membership.source is not distinct from 'internal') asc,
      membership.created_at asc
    limit 1
  ), active_entitlement as (
    select
      coalesce(subscription.plan_key, account.plan, 'free') as plan_key,
      coalesce(plan.display_name, 'Explorer') as display_name,
      coalesce(plan.intelligence_runs_limit, 3) as intelligence_runs_limit,
      coalesce(plan.grounded_chat_limit, 5) as grounded_chat_limit,
      coalesce(plan.max_docs, 1) as max_docs,
      coalesce(plan.max_seats, 1) as max_seats,
      coalesce(plan.history_days, 7) as history_days,
      coalesce((
        select usage.used
        from public.organization_usage_periods as usage
        where usage.organization_id = account.organization_id
          and usage.period_start = date_trunc('month', now())::date
          and usage.metric = 'intelligence_run'
      ), 0) as intelligence_runs_used,
      coalesce((
        select usage.used
        from public.organization_usage_periods as usage
        where usage.organization_id = account.organization_id
          and usage.period_start = date_trunc('month', now())::date
          and usage.metric = 'grounded_chat'
      ), 0) as grounded_chat_used
    from active_account as account
    left join public.organization_subscriptions as subscription
      on subscription.organization_id = account.organization_id
    left join public.plan_limits as plan
      on plan.plan_key = coalesce(subscription.plan_key, account.plan, 'free')
  )
  select jsonb_build_object(
    'accounts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', membership.organization_id,
          'name', membership.name,
          'slug', membership.slug,
          'stage', membership.lifecycle_stage,
          'role', membership.role,
          'source', membership.source
        )
        order by
          (membership.source is not distinct from 'internal') asc,
          membership.created_at asc
      )
      from actor_memberships as membership
    ), '[]'::jsonb),
    'preferences', coalesce((select to_jsonb(preferences) from preferences), jsonb_build_object(
      'active_organization_id', null,
      'accent_color', '#ff6600',
      'compact_mode', false
    )),
    'entitlement', (select jsonb_build_object(
      'planKey', entitlement.plan_key,
      'displayName', entitlement.display_name,
      'intelligenceRuns', jsonb_build_object(
        'used', entitlement.intelligence_runs_used,
        'limit', entitlement.intelligence_runs_limit
      ),
      'groundedChat', jsonb_build_object(
        'used', entitlement.grounded_chat_used,
        'limit', entitlement.grounded_chat_limit
      ),
      'maxDocuments', entitlement.max_docs,
      'maxSeats', entitlement.max_seats,
      'historyDays', entitlement.history_days
    ) from active_entitlement as entitlement)
  );
$$;

revoke all on function public.get_portal_shell(text) from public, anon, authenticated;
grant execute on function public.get_portal_shell(text) to service_role;

create or replace function public.get_dashboard_snapshot(p_clerk_user_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with accessible_organizations as (
    select membership.organization_id
    from public.members as membership
    where membership.user_id = p_clerk_user_id
  )
  select jsonb_build_object(
    'organizations', coalesce((
      select jsonb_agg(to_jsonb(organization) order by organization.last_activity_at desc nulls last)
      from public.organizations as organization
      join accessible_organizations as accessible on accessible.organization_id = organization.id
    ), '[]'::jsonb),
    'intakes', coalesce((
      select jsonb_agg(to_jsonb(intake) order by intake.submitted_at desc)
      from (
        select intake.*
        from public.intake_submissions as intake
        join accessible_organizations as accessible on accessible.organization_id = intake.organization_id
        order by intake.submitted_at desc
        limit 8
      ) as intake
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(to_jsonb(project) order by project.updated_at desc)
      from public.client_projects as project
      join accessible_organizations as accessible on accessible.organization_id = project.organization_id
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', task.id,
        'organization_id', task.organization_id,
        'status', task.status,
        'priority', task.priority,
        'due_date', task.due_date
      ))
      from public.tasks as task
      join accessible_organizations as accessible on accessible.organization_id = task.organization_id
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(
        to_jsonb(activity) || jsonb_build_object('organizations', jsonb_build_object('name', organization.name))
        order by activity.created_at desc
      )
      from (
        select account_activity.*
        from public.account_activity
        join accessible_organizations as accessible
          on accessible.organization_id = account_activity.organization_id
        order by account_activity.created_at desc
        limit 7
      ) as activity
      join public.organizations as organization on organization.id = activity.organization_id
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_dashboard_snapshot(text) from public, anon, authenticated;
grant execute on function public.get_dashboard_snapshot(text) to service_role;

create or replace function public.get_active_organization(p_clerk_user_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with preference as (
    select member_preferences.active_organization_id
    from public.member_preferences
    where member_preferences.user_id = p_clerk_user_id
  )
  select to_jsonb(membership)
    || jsonb_build_object('organizations', to_jsonb(organization))
  from public.members as membership
  join public.organizations as organization on organization.id = membership.organization_id
  left join preference on true
  where membership.user_id = p_clerk_user_id
  order by
    (membership.organization_id = preference.active_organization_id) desc nulls last,
    (organization.source is not distinct from 'internal') asc,
    membership.created_at asc
  limit 1;
$$;

revoke all on function public.get_active_organization(text) from public, anon, authenticated;
grant execute on function public.get_active_organization(text) to service_role;

commit;
