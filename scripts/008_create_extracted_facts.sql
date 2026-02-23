-- Create extracted_facts table (AI-extracted information)
create table if not exists public.extracted_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  chat_id uuid references public.chats(id) on delete cascade,
  fact_type text not null check (fact_type in ('company_info', 'deadline', 'requirement', 'contact', 'financial', 'other')),
  fact_key text not null,
  fact_value text not null,
  confidence_score numeric(3,2) check (confidence_score >= 0 and confidence_score <= 1),
  source text,
  extracted_at timestamptz default now(),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz
);

-- Enable RLS
alter table public.extracted_facts enable row level security;

-- Create indexes
create index if not exists idx_extracted_facts_organization_id on public.extracted_facts(organization_id);
create index if not exists idx_extracted_facts_type on public.extracted_facts(fact_type);
create index if not exists idx_extracted_facts_chat_id on public.extracted_facts(chat_id);
