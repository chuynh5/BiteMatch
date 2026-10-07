-- BiteMatch voting deadline.
-- Rooms can set a deadline (preferences.deadlineMinutes). After it passes,
-- the database refuses new or changed votes, so every phone settles on the
-- same result. Paste into Supabase: SQL Editor > New query > Run.
-- Safe to run more than once. Rooms without a deadline are unaffected.

create or replace function public.voting_open(p_room text)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select case
        when (r.preferences ->> 'deadlineMinutes') is null then true
        -- 5 seconds of grace for phones whose clocks run a little behind.
        else now() <= r.created_at
          + make_interval(mins => (r.preferences ->> 'deadlineMinutes')::int)
          + interval '5 seconds'
      end
      from public.rooms r
      where r.code = p_room
    ),
    true
  );
$$;

grant execute on function public.voting_open(text) to anon, authenticated;

drop policy if exists "votes can be cast"    on public.votes;
drop policy if exists "votes can be changed" on public.votes;
create policy "votes can be cast"    on public.votes for insert with check (public.voting_open(room_code));
create policy "votes can be changed" on public.votes for update using (true) with check (public.voting_open(room_code));
