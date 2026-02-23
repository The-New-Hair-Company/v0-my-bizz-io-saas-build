-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('deadline', 'task', 'filing', 'system', 'chat')),
  read boolean default false,
  action_url text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Create indexes
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
