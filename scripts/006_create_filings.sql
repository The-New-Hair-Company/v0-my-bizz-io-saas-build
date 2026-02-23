-- Create filings table (for compliance filings)
create table if not exists public.filings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  filing_type text not null,
  jurisdiction text not null,
  due_date date not null,
  filing_date date,
  status text not null check (status in ('upcoming', 'in_progress', 'filed', 'overdue')) default 'upcoming',
  confirmation_number text,
  document_id uuid references public.documents(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.filings enable row level security;

-- Create indexes
create index if not exists idx_filings_organization_id on public.filings(organization_id);
create index if not exists idx_filings_due_date on public.filings(due_date);
create index if not exists idx_filings_status on public.filings(status);
create index if not exists idx_filings_jurisdiction on public.filings(jurisdiction);
