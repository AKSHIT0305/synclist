-- 0005_tasks_notes: tasks and their notes (a separate row so title and note edits never clash).

create type public.task_priority as enum ('none', 'low', 'medium', 'high');

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),  -- clients may supply ids (offline create)
  list_id     uuid not null references public.lists (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 500),
  is_done     boolean not null default false,
  done_by     uuid references auth.users (id) on delete set null,
  done_at     timestamptz,
  -- fractional-indexing key; "C" collation so ORDER BY matches the library's byte ordering.
  position    text collate "C" not null check (char_length(position) between 1 and 256),
  due_at      timestamptz,
  priority    public.task_priority not null default 'none',
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  version     integer not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  check (is_done or (done_at is null and done_by is null)),
  check (not is_done or done_at is not null)
);

create index tasks_list_done_position_idx on public.tasks (list_id, is_done, position);
create index tasks_list_updated_idx on public.tasks (list_id, updated_at);

create table public.task_notes (
  task_id     uuid primary key references public.tasks (id) on delete cascade,
  -- Denormalised from tasks (set by trigger) so RLS and Realtime can filter by list.
  list_id     uuid not null references public.lists (id) on delete cascade,
  -- Rich-text document JSON. The 10,000-character limit applies to the note's visible text and is
  -- enforced in the app; this is a looser safety cap on the serialised JSON.
  content     jsonb not null default '{"type":"doc","content":[]}'::jsonb
              check (octet_length(content::text) <= 50000),
  created_at  timestamptz not null default now(),
  version     integer not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz
);

create index task_notes_list_updated_idx on public.task_notes (list_id, updated_at);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create trigger tasks_set_updated_at
  before insert or update on public.tasks
  for each row execute function public.set_updated_at();

create trigger tasks_bump_version
  before insert or update on public.tasks
  for each row execute function public.bump_version();

create trigger task_notes_set_updated_at
  before insert or update on public.task_notes
  for each row execute function public.set_updated_at();

create trigger task_notes_bump_version
  before insert or update on public.task_notes
  for each row execute function public.bump_version();

-- Keeps done_by / done_at consistent with is_done, and pins immutable columns.
-- done_at may come from the client (an offline tick keeps its real time); done_by is always the caller.
create or replace function public.guard_task_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.list_id is distinct from old.list_id then
      raise exception 'tasks cannot move between lists' using errcode = 'SL403';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  elsif auth.uid() is not null then
    new.created_by := auth.uid();
    new.created_at := now();
  end if;

  if new.is_done then
    if tg_op = 'INSERT' or not old.is_done then
      new.done_at := least(coalesce(new.done_at, now()), now());
      new.done_by := coalesce(auth.uid(), new.done_by);
    else
      new.done_at := old.done_at;
      new.done_by := old.done_by;
    end if;
  else
    new.done_at := null;
    new.done_by := null;
  end if;

  return new;
end;
$$;

create trigger tasks_guard_write
  before insert or update on public.tasks
  for each row execute function public.guard_task_write();

-- v1 limit: 2,000 open (not done, not deleted) tasks per list.
create or replace function public.enforce_open_task_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.is_done and new.deleted_at is null
     and (tg_op = 'INSERT' or old.is_done or old.deleted_at is not null) then
    perform pg_advisory_xact_lock(hashtextextended('tasks:' || new.list_id::text, 0));
    if (select count(*) from public.tasks t
        where t.list_id = new.list_id and not t.is_done and t.deleted_at is null) >= 2000 then
      raise exception 'a list can have at most 2000 open tasks' using errcode = 'SL413';
    end if;
  end if;
  return new;
end;
$$;

create trigger tasks_enforce_open_limit
  before insert or update of is_done, deleted_at on public.tasks
  for each row execute function public.enforce_open_task_limit();

-- task_notes.list_id always mirrors its task's list.
create or replace function public.set_note_list_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.task_id is distinct from old.task_id then
    raise exception 'task_id cannot be changed' using errcode = 'SL403';
  end if;
  select t.list_id into new.list_id from public.tasks t where t.id = new.task_id;
  if new.list_id is null then
    raise exception 'task % not found', new.task_id using errcode = '23503';
  end if;
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger task_notes_set_list_id
  before insert or update on public.task_notes
  for each row execute function public.set_note_list_id();
