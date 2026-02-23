-- Create members table (links users to organizations)
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, user_id)
);

-- Enable RLS
alter table public.members enable row level security;

-- Create indexes
create index if not exists idx_members_organization_id on public.members(organization_id);
create index if not exists idx_members_user_id on public.members(user_id);
create index if not exists idx_members_role on public.members(role);
