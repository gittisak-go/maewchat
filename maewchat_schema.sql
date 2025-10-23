-- maewchat_schema.sql
-- Supabase/Postgres schema for "maewchat"
-- Usage: paste into Supabase SQL editor and run

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user1_id uuid not null,
  user2_id uuid not null,
  last_message jsonb         -- { id, sender_id, content, created_at }
);

-- Optional unique index to avoid duplicate pair (order-agnostic)
create unique index if not exists idx_conversations_unique_pair on public.conversations
((least(user1_id,user2_id)), (greatest(user1_id,user2_id)));

-- 2. Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  sender_id uuid not null default auth.uid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  content text not null
);

create index if not exists idx_messages_conv_created_at on public.messages (conversation_id, created_at desc);

-- 3. Views: usernames and users
create or replace view public.usernames as
select raw_user_meta_data ->> 'username' as username
from auth.users;

grant select on table public.usernames to anon;

create or replace view public.users as
select
  id,
  email,
  raw_user_meta_data->>'username' as username,
  raw_user_meta_data->>'fullname' as fullname,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  raw_user_meta_data->>'bio' as bio
from auth.users;

grant select on table public.users to authenticated;

-- 4. Trigger: update conversations.last_message on new message
create or replace function public.handle_new_message() returns trigger as $$
begin
  update public.conversations
  set last_message = jsonb_build_object(
    'id', NEW.id,
    'sender_id', NEW.sender_id,
    'content', NEW.content,
    'created_at', NEW.created_at
  )
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_messages_after_insert on public.messages;
create trigger trg_messages_after_insert
after insert on public.messages
for each row execute function public.handle_new_message();

-- 5. Row-Level Security (RLS) policies
alter table public.messages enable row level security;
alter table public.conversations enable row level security;

create policy "messages_insert_authenticated" on public.messages
for insert
using (auth.role() = 'authenticated')
with check (auth.uid() is not null and auth.role() = 'authenticated');

create policy "messages_select_conversation_participant" on public.messages
for select
using (
  exists (
    select 1 from public.conversations c
    where c.id = public.messages.conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
);

create policy "conversations_insert_authenticated" on public.conversations
for insert
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "conversations_select_participant" on public.conversations
for select
using (user1_id = auth.uid() or user2_id = auth.uid());

create policy "conversations_update_participant" on public.conversations
for update
using (user1_id = auth.uid() or user2_id = auth.uid())
with check (user1_id = auth.uid() or user2_id = auth.uid());

-- 6. Helpful indices
create index if not exists idx_conversations_user1 on public.conversations (user1_id);
create index if not exists idx_conversations_user2 on public.conversations (user2_id);