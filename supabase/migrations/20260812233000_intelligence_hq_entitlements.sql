-- Intelligence HQ: commercial entitlements, zero-token workflow runs and tenant audit data.
-- Clerk authenticates the actor; Supabase RLS and the quota RPC authorise every operation.

begin;

alter table public.plan_limits
  add column if not exists display_name text,
  add column if not exists description text,
  add column if not exists monthly_price_gbp integer not null default 0,
  add column if not exists intelligence_runs_limit integer not null default 0,
  add column if not exists grounded_chat_limit integer not null default 0,
  add column if not exists max_seats integer not null default 1,
  add column if not exists history_days integer not null default 7,
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists is_public boolean not null default true,
  add column if not exists sort_order integer not null default 0;

update public.plan_limits set
  display_name = case plan_key when 'free' then 'Explorer' when 'starter' then 'Studio' when 'pro' then 'Scale' else 'Enterprise' end,
  description = case plan_key when 'free' then 'Prove the value on one live workspace' when 'starter' then 'Intelligence for a focused agency team' when 'pro' then 'Portfolio-wide operating intelligence' else 'Custom controls, scale and assurance' end,
  monthly_price_gbp = case plan_key when 'free' then 0 when 'starter' then 49 when 'pro' then 149 else 0 end,
  intelligence_runs_limit = case plan_key when 'free' then 3 when 'starter' then 100 when 'pro' then 500 else 999999 end,
  grounded_chat_limit = case plan_key when 'free' then 5 when 'starter' then 250 when 'pro' then 2000 else 999999 end,
  max_docs = case plan_key when 'free' then 1 when 'starter' then 25 when 'pro' then 250 else 5000 end,
  max_seats = case plan_key when 'free' then 1 when 'starter' then 5 when 'pro' then 20 else 5000 end,
  history_days = case plan_key when 'free' then 7 when 'starter' then 90 when 'pro' then 3650 else 3650 end,
  features = case plan_key
    when 'free' then '["3 intelligence runs", "5 grounded questions", "1 knowledge file", "1 seat", "7-day history"]'::jsonb
    when 'starter' then '["100 intelligence runs", "250 grounded questions", "25 knowledge files", "5 seats", "90-day history"]'::jsonb
    when 'pro' then '["500 intelligence runs", "2,000 grounded questions", "250 knowledge files", "20 seats", "Full history"]'::jsonb
    else '["Custom intelligence volume", "Custom seats and storage", "Full history", "Priority assurance"]'::jsonb
  end,
  sort_order = case plan_key when 'free' then 0 when 'starter' then 10 when 'pro' then 20 else 30 end;

alter table public.organizations add column if not exists plan text not null default 'free';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'organizations_plan_fkey'
      and conrelid = 'public.organizations'::regclass
  ) then
    alter table public.organizations
      add constraint organizations_plan_fkey foreign key (plan) references public.plan_limits(plan_key);
  end if;
end $$;

create table if not exists public.organization_subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan_key text not null default 'free' references public.plan_limits(plan_key),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'cancelled', 'paused')),
  provider text not null default 'manual' check (provider in ('manual', 'clerk', 'stripe')),
  provider_subscription_id text unique,
  provider_customer_id text,
  current_period_start timestamptz not null default date_trunc('month', now()),
  current_period_end timestamptz not null default (date_trunc('month', now()) + interval '1 month'),
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_subscriptions_plan_status_idx
  on public.organization_subscriptions (plan_key, status);

insert into public.organization_subscriptions (organization_id, plan_key, status, provider)
select id, plan, 'active', 'manual' from public.organizations
on conflict (organization_id) do nothing;

update public.organizations set plan = 'enterprise' where source = 'internal';
update public.organization_subscriptions s set plan_key = 'enterprise', updated_at = now()
from public.organizations o where o.id = s.organization_id and o.source = 'internal';

create table if not exists public.organization_usage_periods (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period_start date not null,
  metric text not null check (metric in ('intelligence_run', 'grounded_chat')),
  used integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, period_start, metric)
);

create index if not exists organization_usage_periods_org_period_idx
  on public.organization_usage_periods (organization_id, period_start desc);

create table if not exists public.ai_workflows (
  workflow_key text primary key,
  name text not null,
  short_name text not null,
  category text not null,
  description text not null,
  prompt_hint text not null,
  cadence text not null,
  output_schema jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_key text not null references public.ai_workflows(workflow_key),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  question text,
  headline text,
  summary text,
  output jsonb not null default '{}'::jsonb,
  confidence smallint check (confidence between 0 and 100),
  source_count integer not null default 0 check (source_count >= 0),
  action_count integer not null default 0 check (action_count >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  error_message text,
  created_by text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_runs_org_created_idx
  on public.ai_runs (organization_id, created_at desc);
create index if not exists ai_runs_org_status_idx
  on public.ai_runs (organization_id, status, created_at desc);

create table if not exists public.ai_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  step_key text not null,
  label text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  detail text,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  position smallint not null,
  started_at timestamptz,
  completed_at timestamptz,
  unique (run_id, step_key)
);

create index if not exists ai_run_steps_run_position_idx on public.ai_run_steps (run_id, position);
create index if not exists ai_run_steps_organization_idx on public.ai_run_steps (organization_id);

create table if not exists public.ai_run_sources (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_runs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_kind text not null check (source_kind in ('account', 'project', 'task', 'deadline', 'intake', 'document', 'knowledge', 'activity')),
  source_id text not null,
  title text not null,
  excerpt text not null,
  relevance real not null default 0 check (relevance between 0 and 1),
  source_updated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_run_sources_run_relevance_idx on public.ai_run_sources (run_id, relevance desc);
create index if not exists ai_run_sources_organization_idx on public.ai_run_sources (organization_id);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_id uuid references public.ai_runs(id) on delete set null,
  insight_type text not null check (insight_type in ('risk', 'opportunity', 'decision', 'action')),
  title text not null,
  summary text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  confidence smallint not null check (confidence between 0 and 100),
  status text not null default 'open' check (status in ('open', 'accepted', 'dismissed', 'completed')),
  action_payload jsonb not null default '{}'::jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_insights_org_status_idx
  on public.ai_insights (organization_id, status, created_at desc);
create index if not exists ai_insights_run_idx on public.ai_insights (run_id) where run_id is not null;

alter table public.organization_subscriptions enable row level security;
alter table public.organization_usage_periods enable row level security;
alter table public.ai_workflows enable row level security;
alter table public.ai_runs enable row level security;
alter table public.ai_run_steps enable row level security;
alter table public.ai_run_sources enable row level security;
alter table public.ai_insights enable row level security;

drop policy if exists subscriptions_tenant_select on public.organization_subscriptions;
create policy subscriptions_tenant_select on public.organization_subscriptions for select to authenticated
  using ((select private.is_organization_member(organization_id)));

drop policy if exists usage_tenant_select on public.organization_usage_periods;
create policy usage_tenant_select on public.organization_usage_periods for select to authenticated
  using ((select private.is_organization_member(organization_id)));
drop policy if exists usage_tenant_insert on public.organization_usage_periods;
create policy usage_tenant_insert on public.organization_usage_periods for insert to authenticated
  with check (
    (select private.is_organization_member(organization_id))
    and period_start = date_trunc('month', now())::date
    and used = 0
  );
drop policy if exists usage_tenant_update on public.organization_usage_periods;
create policy usage_tenant_update on public.organization_usage_periods for update to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check (
    (select private.is_organization_member(organization_id))
    and period_start = date_trunc('month', now())::date
  );

create or replace function private.enforce_usage_monotonic()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.organization_id <> old.organization_id
    or new.period_start <> old.period_start
    or new.metric <> old.metric
    or new.used < old.used then
    raise exception 'Usage counters are immutable and monotonic' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists organization_usage_monotonic on public.organization_usage_periods;
create trigger organization_usage_monotonic
before update on public.organization_usage_periods
for each row execute function private.enforce_usage_monotonic();

revoke all on function private.enforce_usage_monotonic() from public, anon, authenticated;

drop policy if exists workflows_authenticated_select on public.ai_workflows;
create policy workflows_authenticated_select on public.ai_workflows for select to authenticated using (active);

drop policy if exists ai_runs_tenant_select on public.ai_runs;
drop policy if exists ai_runs_tenant_insert on public.ai_runs;
drop policy if exists ai_runs_tenant_update on public.ai_runs;
create policy ai_runs_tenant_select on public.ai_runs for select to authenticated
  using ((select private.is_organization_member(organization_id)));
create policy ai_runs_tenant_insert on public.ai_runs for insert to authenticated
  with check ((select private.is_organization_member(organization_id)) and created_by = (select private.current_actor_id()));
create policy ai_runs_tenant_update on public.ai_runs for update to authenticated
  using ((select private.is_organization_member(organization_id)) and created_by = (select private.current_actor_id()))
  with check ((select private.is_organization_member(organization_id)) and created_by = (select private.current_actor_id()));

drop policy if exists ai_run_steps_tenant_all on public.ai_run_steps;
create policy ai_run_steps_tenant_all on public.ai_run_steps for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));

drop policy if exists ai_run_sources_tenant_all on public.ai_run_sources;
create policy ai_run_sources_tenant_all on public.ai_run_sources for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)));

drop policy if exists ai_insights_tenant_all on public.ai_insights;
create policy ai_insights_tenant_all on public.ai_insights for all to authenticated
  using ((select private.is_organization_member(organization_id)))
  with check ((select private.is_organization_member(organization_id)) and created_by = (select private.current_actor_id()));

create or replace function public.consume_ai_entitlement(
  p_organization_id uuid,
  p_metric text,
  p_amount integer default 1
)
returns table (allowed boolean, used integer, quota_limit integer, remaining integer, plan_key text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan text;
  v_limit integer;
  v_used integer;
  v_period date := date_trunc('month', now())::date;
begin
  if p_amount < 1 or p_amount > 100 then
    raise exception 'Invalid entitlement amount';
  end if;
  if p_metric not in ('intelligence_run', 'grounded_chat') then
    raise exception 'Unknown entitlement metric';
  end if;
  if not private.is_organization_member(p_organization_id) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  select o.plan,
    case p_metric
      when 'intelligence_run' then pl.intelligence_runs_limit
      else pl.grounded_chat_limit
    end
  into v_plan, v_limit
  from public.organizations o
  join public.plan_limits pl on pl.plan_key = o.plan
  where o.id = p_organization_id;

  if v_plan is null then
    raise exception 'Organization plan is not configured';
  end if;

  insert into public.organization_usage_periods (organization_id, period_start, metric, used)
  values (p_organization_id, v_period, p_metric, 0)
  on conflict (organization_id, period_start, metric) do nothing;

  update public.organization_usage_periods u
  set used = u.used + p_amount, updated_at = now()
  where u.organization_id = p_organization_id
    and u.period_start = v_period
    and u.metric = p_metric
    and u.used + p_amount <= v_limit
  returning u.used into v_used;

  if v_used is null then
    select u.used into v_used from public.organization_usage_periods u
    where u.organization_id = p_organization_id and u.period_start = v_period and u.metric = p_metric;
    return query select false, coalesce(v_used, 0), v_limit, greatest(v_limit - coalesce(v_used, 0), 0), v_plan;
  else
    return query select true, v_used, v_limit, greatest(v_limit - v_used, 0), v_plan;
  end if;
end;
$$;

revoke all on function public.consume_ai_entitlement(uuid, text, integer) from public, anon;
grant execute on function public.consume_ai_entitlement(uuid, text, integer) to authenticated;

grant select on public.plan_limits, public.organization_subscriptions, public.organization_usage_periods, public.ai_workflows to authenticated;
grant insert, update on public.organization_usage_periods to authenticated;
grant select, insert, update on public.ai_runs, public.ai_run_steps, public.ai_run_sources, public.ai_insights to authenticated;
grant all privileges on public.organization_subscriptions, public.organization_usage_periods, public.ai_workflows,
  public.ai_runs, public.ai_run_steps, public.ai_run_sources, public.ai_insights to service_role;

insert into public.ai_workflows (workflow_key, name, short_name, category, description, prompt_hint, cadence, output_schema, sort_order)
values
  ('weekly-priorities', 'Weekly Priority Brief', 'Priority brief', 'operations', 'Ranks the work most likely to move delivery, revenue and client trust this week.', 'What needs decisive attention this week?', 'Weekly', '{"sections":["signals","priorities","actions"]}', 10),
  ('delivery-risk', 'Delivery Risk Radar', 'Risk radar', 'delivery', 'Finds overdue work, compressed deadlines and accounts whose health signals are deteriorating.', 'Where is delivery most exposed?', 'On demand', '{"sections":["risk_score","drivers","mitigations"]}', 20),
  ('growth-brief', 'Growth & GTM Brief', 'Growth brief', 'growth', 'Turns pipeline, intake and portfolio evidence into a practical growth thesis and next moves.', 'Where is the most credible growth leverage?', 'Monthly', '{"sections":["thesis","opportunities","experiments"]}', 30),
  ('readiness-review', 'Readiness & Governance Review', 'Readiness review', 'governance', 'Checks knowledge coverage, ownership, milestones and evidence readiness before a critical decision.', 'What is missing before we commit?', 'Before decisions', '{"sections":["readiness","gaps","controls"]}', 40)
on conflict (workflow_key) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  category = excluded.category,
  description = excluded.description,
  prompt_hint = excluded.prompt_hint,
  cadence = excluded.cadence,
  output_schema = excluded.output_schema,
  active = true,
  sort_order = excluded.sort_order,
  updated_at = now();

commit;
