-- Create audit_logs table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Create indexes
create index if not exists idx_audit_logs_organization_id on public.audit_logs(organization_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);
