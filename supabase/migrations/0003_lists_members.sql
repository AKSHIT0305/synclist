-- 0003_lists_members: lists, membership + roles, and the membership helper functions used by RLS.

create type public.member_role as enum ('owner', 'editor', 'viewer');
-- Push preference per list (used from v1.5): every change / assigned to me / my tasks done / nothing.
create type public.notify_level as enum ('all', 'assigned_to_me', 'my_tasks', 'none');

create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  emoji       text not null default '📝' check (char_length(emoji) between 1 and 16),
  color       text not null default '#208AEF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz
);

create table public.list_members (
  list_id       uuid not null references public.lists (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          public.member_role not null,
  notify_level  public.notify_level not null default 'all',
  joined_at     timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  -- Soft delete = left or removed. Kept so other devices (and the removed user) can sync it.
  deleted_at    timestamptz,
  primary key (list_id, user_id)
);

create index list_members_user_id_idx on public.list_members (user_id);
create index lists_updated_at_idx on public.lists (updated_at);
create index list_members_list_updated_idx on public.list_members (list_id, updated_at);

create trigger lists_set_updated_at
  before insert or update on public.lists
  for each row execute function public.set_updated_at();

create trigger list_members_set_updated_at
  before insert or update on public.list_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Membership helpers. SECURITY DEFINER so RLS policies can call them without
-- recursing into list_members' own policies.
-- ---------------------------------------------------------------------------

-- Caller's active role in a list, or null if not an active member.
create or replace function public.list_role(p_list_id uuid)
returns public.member_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.list_members m
  where m.list_id = p_list_id
    and m.user_id = auth.uid()
    and m.deleted_at is null;
$$;

create or replace function public.is_list_member(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.list_role(p_list_id) is not null;
$$;

-- Owner or editor of a list that has not been deleted.
create or replace function public.can_edit_list(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.list_role(p_list_id) in ('owner', 'editor'), false)
     and exists (select 1 from public.lists l where l.id = p_list_id and l.deleted_at is null);
$$;

-- True when the caller and p_user_id are both active members of at least one common list.
create or replace function public.shares_list_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.list_members mine
    join public.list_members theirs on theirs.list_id = mine.list_id
    where mine.user_id = auth.uid()
      and mine.deleted_at is null
      and theirs.user_id = p_user_id
      and theirs.deleted_at is null
  );
$$;

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- The creator of a list automatically becomes its owner.
create or replace function public.add_list_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.list_members (list_id, user_id, role, updated_by)
  values (new.id, new.owner_id, 'owner', new.owner_id);
  return new;
end;
$$;

create trigger lists_add_owner
  after insert on public.lists
  for each row execute function public.add_list_owner();

-- Ownership can't be changed by clients (ownership transfer is a later, server-side feature).
create or replace function public.guard_list_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed' using errcode = 'SL403';
  end if;
  return new;
end;
$$;

create trigger lists_guard_update
  before update on public.lists
  for each row execute function public.guard_list_update();

-- Membership changes from clients:
--   * only the list owner may change roles, and nobody may grant or remove 'owner'
--   * only the member themself may change their notify_level
--   * the owner row can't be soft-deleted (owner must transfer ownership first)
-- Requests without a JWT (service role / Edge Functions) are trusted.
create or replace function public.guard_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return new;
  end if;

  if new.list_id is distinct from old.list_id or new.user_id is distinct from old.user_id
     or new.joined_at is distinct from old.joined_at then
    raise exception 'membership keys cannot be changed' using errcode = 'SL403';
  end if;

  if new.role is distinct from old.role then
    if public.list_role(old.list_id) is distinct from 'owner' then
      raise exception 'only the list owner can change roles' using errcode = 'SL403';
    end if;
    if old.role = 'owner' or new.role = 'owner' then
      raise exception 'ownership cannot be granted or removed here' using errcode = 'SL403';
    end if;
  end if;

  if new.notify_level is distinct from old.notify_level and old.user_id <> v_uid then
    raise exception 'members can only change their own notifications' using errcode = 'SL403';
  end if;

  if new.deleted_at is distinct from old.deleted_at then
    if old.role = 'owner' then
      raise exception 'the owner cannot leave without transferring ownership' using errcode = 'SL403';
    end if;
    -- Leaving: you may remove yourself. Removing others: owners only. Re-joining: server only.
    if new.deleted_at is null then
      raise exception 'rejoining goes through an invite' using errcode = 'SL403';
    end if;
    if old.user_id <> v_uid and public.list_role(old.list_id) is distinct from 'owner' then
      raise exception 'only the owner can remove members' using errcode = 'SL403';
    end if;
  end if;

  return new;
end;
$$;

create trigger list_members_guard_update
  before update on public.list_members
  for each row execute function public.guard_member_update();

-- v1 limit: 50 active members per list.
create or replace function public.enforce_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.deleted_at is null and (tg_op = 'INSERT' or old.deleted_at is not null) then
    perform pg_advisory_xact_lock(hashtextextended('members:' || new.list_id::text, 0));
    if (select count(*) from public.list_members m
        where m.list_id = new.list_id and m.deleted_at is null) >= 50 then
      raise exception 'a list can have at most 50 members' using errcode = 'SL413';
    end if;
  end if;
  return new;
end;
$$;

create trigger list_members_enforce_limit
  before insert or update of deleted_at on public.list_members
  for each row execute function public.enforce_member_limit();
