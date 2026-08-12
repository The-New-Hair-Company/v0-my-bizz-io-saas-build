-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- Create indexes
create index if not exists idx_messages_chat_id on public.messages(chat_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
