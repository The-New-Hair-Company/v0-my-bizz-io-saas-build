-- Create documents table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  document_type text not null check (document_type in ('certificate', 'filing', 'contract', 'agreement', 'policy', 'other')),
  file_url text,
  file_size bigint,
  mime_type text,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.documents enable row level security;

-- Create indexes
create index if not exists idx_documents_organization_id on public.documents(organization_id);
create index if not exists idx_documents_type on public.documents(document_type);
create index if not exists idx_documents_created_at on public.documents(created_at desc);
