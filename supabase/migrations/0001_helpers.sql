-- 0001_helpers: extensions and generic trigger functions shared by every table.

create extension if not exists pgcrypto with schema extensions;

-- Custom SQLSTATEs raised by SyncList (clients match on these codes):
--   SL429  rate limit exceeded
--   SL413  size limit exceeded (members per list, open tasks per list)
--   SL403  forbidden change that RLS alone cannot express (e.g. changing a role)

-- Stamps updated_at / updated_by on every insert and update.
-- updated_by falls back to the supplied value when there is no JWT (service role, migrations, seed).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

-- Server-owned optimistic-concurrency counter. Clients can never set it directly.
create or replace function public.bump_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
  else
    new.version := old.version + 1;
  end if;
  return new;
end;
$$;
