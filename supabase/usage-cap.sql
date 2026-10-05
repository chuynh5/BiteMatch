-- BiteMatch: daily caps for Google requests, so the bill stays at $0.
-- Paste into Supabase: SQL Editor > New query > Run. Safe to run more than once.

create table if not exists public.api_usage (
  day   date not null,
  kind  text not null,
  count integer not null default 0,
  primary key (day, kind)
);

-- Locked down: no policies, so the app can't read or change this table directly.
-- It can only go through try_use_quota below.
alter table public.api_usage enable row level security;

-- Atomically uses one unit of today's allowance for `quota_kind`.
-- Returns true if allowed, false once `daily_limit` is reached.
-- Days follow Pacific time, which is when Google resets its own quotas.
create or replace function public.try_use_quota(quota_kind text, daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Los_Angeles')::date;
  used integer;
begin
  if quota_kind not in ('google_photo', 'google_nearby', 'google_text') or daily_limit < 0 or daily_limit > 1000 then
    return false;
  end if;

  insert into public.api_usage as u (day, kind, count)
  values (today, quota_kind, 1)
  on conflict (day, kind) do update
    set count = u.count + 1
    where u.count < daily_limit
  returning u.count into used;

  -- No row returned means the update was skipped: the limit was already reached.
  return used is not null and used <= daily_limit;
end;
$$;

revoke all on function public.try_use_quota(text, integer) from public;
grant execute on function public.try_use_quota(text, integer) to anon, authenticated;

-- See today's usage any time with:
--   select * from api_usage order by day desc, kind;

-- Monthly version (what the app uses now). Google's free allowance resets
-- monthly, so a busy night can use more as long as the month stays under it.
-- Rows are stored with `day` = the first day of the month.
create or replace function public.try_use_monthly_quota(quota_kind text, monthly_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  this_month date := date_trunc('month', now() at time zone 'America/Los_Angeles')::date;
  used integer;
begin
  if quota_kind not in ('google_photo', 'google_nearby', 'google_text') or monthly_limit < 0 or monthly_limit > 5000 then
    return false;
  end if;

  insert into public.api_usage as u (day, kind, count)
  values (this_month, quota_kind || '_month', 1)
  on conflict (day, kind) do update
    set count = u.count + 1
    where u.count < monthly_limit
  returning u.count into used;

  return used is not null and used <= monthly_limit;
end;
$$;

revoke all on function public.try_use_monthly_quota(text, integer) from public;
grant execute on function public.try_use_monthly_quota(text, integer) to anon, authenticated;
