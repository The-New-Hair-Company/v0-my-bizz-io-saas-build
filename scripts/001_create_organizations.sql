-- Create organizations table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ein text,
  entity_type text,
  state_of_incorporation text,
  incorporation_date date,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  website text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.organizations enable row level security;

-- Create index for faster lookups
create index if not exists idx_organizations_created_at on public.organizations(created_at desc);
