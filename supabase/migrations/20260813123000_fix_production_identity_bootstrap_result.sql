begin;

drop function if exists public.bootstrap_application_admin(text, text, text, text);

create function public.bootstrap_application_admin(
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
