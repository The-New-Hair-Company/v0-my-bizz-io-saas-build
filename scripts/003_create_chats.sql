-- Create chats table
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.chats enable row level security;

-- Create indexes
create index if not exists idx_chats_organization_id on public.chats(organization_id);
create index if not exists idx_chats_created_by on public.chats(created_by);
create index if not exists idx_chats_created_at on public.chats(created_at desc);
