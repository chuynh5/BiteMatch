-- BiteMatch database setup.
-- Paste this whole file into Supabase: SQL Editor > New query > Run.
-- Safe to run more than once.

create table if not exists public.rooms (
  code        text primary key check (code ~ '^[0-9]{4}$'),
  preferences jsonb not null,
  restaurants jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.participants (
  id        uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(code) on delete cascade,
  name      text not null check (char_length(name) between 1 and 40),
  color     text not null,
  joined_at timestamptz not null default now()
);

create table if not exists public.votes (
  room_code      text not null references public.rooms(code) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  restaurant_id  text not null,
  vote           text not null check (vote in ('like', 'pass')),
  updated_at     timestamptz not null default now(),
  primary key (participant_id, restaurant_id)
);

create index if not exists participants_room_idx on public.participants(room_code);
create index if not exists votes_room_idx on public.votes(room_code);

-- Row Level Security: anyone with the app can create rooms, join with a code,
-- and vote. There are no accounts, so the room code is the "password".
-- Good enough for a side project among friends.
alter table public.rooms        enable row level security;
alter table public.participants enable row level security;
alter table public.votes        enable row level security;

drop policy if exists "rooms are readable"   on public.rooms;
drop policy if exists "rooms can be created" on public.rooms;
create policy "rooms are readable"   on public.rooms for select using (true);
create policy "rooms can be created" on public.rooms for insert with check (true);

drop policy if exists "participants are readable" on public.participants;
drop policy if exists "participants can join"     on public.participants;
create policy "participants are readable" on public.participants for select using (true);
create policy "participants can join"     on public.participants for insert with check (true);

drop policy if exists "votes are readable"  on public.votes;
drop policy if exists "votes can be cast"   on public.votes;
drop policy if exists "votes can be changed" on public.votes;
create policy "votes are readable"   on public.votes for select using (true);
create policy "votes can be cast"    on public.votes for insert with check (true);
create policy "votes can be changed" on public.votes for update using (true) with check (true);

-- Turn on live updates for joins and votes.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'participants') then
    alter publication supabase_realtime add table public.participants;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'votes') then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;
