-- Stripe Billing: idempotent, service-role-only subscription entitlement updates.

begin;

alter table public.organization_subscriptions
  add column if not exists provider_price_id text;

create table if not exists public.billing_webhook_events (
  event_id text primary key,
  event_type text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  processed_at timestamptz not null default now()
);

alter table public.billing_webhook_events enable row level security;
revoke all on public.billing_webhook_events from public, anon, authenticated;
grant all privileges on public.billing_webhook_events to service_role;

create or replace function public.apply_stripe_subscription_event(
  p_event_id text,
  p_event_type text,
  p_organization_id uuid,
  p_plan_key text,
  p_status text,
  p_customer_id text,
  p_subscription_id text,
  p_price_id text,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null,
  p_cancel_at_period_end boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
  v_entitled_plan text;
begin
  if nullif(trim(p_event_id), '') is null
    or nullif(trim(p_event_type), '') is null
    or p_organization_id is null
    or p_plan_key not in ('starter', 'pro')
    or p_status not in ('active', 'trialing', 'past_due', 'cancelled', 'paused') then
    raise exception 'Invalid Stripe subscription event';
  end if;

  insert into public.billing_webhook_events (event_id, event_type, organization_id)
  values (p_event_id, p_event_type, p_organization_id)
  on conflict (event_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return false; end if;

  v_entitled_plan := case when p_status in ('active', 'trialing', 'past_due') then p_plan_key else 'free' end;

  insert into public.organization_subscriptions (
    organization_id, plan_key, status, provider, provider_subscription_id,
    provider_customer_id, provider_price_id, current_period_start,
    current_period_end, cancel_at_period_end, updated_at
  ) values (
    p_organization_id, v_entitled_plan, p_status, 'stripe', p_subscription_id,
    p_customer_id, p_price_id, coalesce(p_period_start, now()),
    coalesce(p_period_end, now() + interval '1 month'), p_cancel_at_period_end, now()
  )
  on conflict (organization_id) do update set
    plan_key = excluded.plan_key,
    status = excluded.status,
    provider = 'stripe',
    provider_subscription_id = coalesce(excluded.provider_subscription_id, public.organization_subscriptions.provider_subscription_id),
    provider_customer_id = coalesce(excluded.provider_customer_id, public.organization_subscriptions.provider_customer_id),
    provider_price_id = coalesce(excluded.provider_price_id, public.organization_subscriptions.provider_price_id),
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    updated_at = now();

  update public.organizations
  set plan = v_entitled_plan, updated_at = now()
  where id = p_organization_id;

  return true;
end;
$$;

revoke all on function public.apply_stripe_subscription_event(text, text, uuid, text, text, text, text, text, timestamptz, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(text, text, uuid, text, text, text, text, text, timestamptz, timestamptz, boolean) to service_role;

commit;
