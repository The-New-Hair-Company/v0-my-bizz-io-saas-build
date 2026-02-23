-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null check (status in ('todo', 'in_progress', 'done', 'cancelled')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  filing_id uuid references public.filings(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.tasks enable row level security;

-- Create indexes
create index if not exists idx_tasks_organization_id on public.tasks(organization_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_priority on public.tasks(priority);
