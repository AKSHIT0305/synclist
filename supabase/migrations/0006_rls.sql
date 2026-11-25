-- 0006_rls: grants + row-level security for every table.
--
-- Model:
--   * read:   active members of a list can read everything in it (soft-deleted rows included, for sync)
--   * write:  owners + editors write tasks and notes; viewers are read-only
--   * lists:  only the owner updates or soft-deletes a list
--   * roles:  only the owner changes roles (enforced by guard_member_update)
--   * join:   no client inserts into list_members; joining goes through the join-list Edge Function
--   * delete: clients never hard-delete; everything is soft-deleted via deleted_at
--
-- Supabase's default privileges grant anon/authenticated ALL on new tables (incl. TRUNCATE, which
-- bypasses RLS), so we revoke everything and grant back only what each role needs.

revoke all on public.profiles, public.lists, public.list_members, public.invites,
              public.tasks, public.task_notes
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- push_tokens is deliberately NOT granted: tokens are managed by server-side functions only.
grant select (id, display_name, avatar_url, onboarded_at, created_at, updated_at, deleted_at)
  on public.profiles to authenticated;
grant update (display_name, avatar_url, onboarded_at) on public.profiles to authenticated;

create policy "profiles: read self and people you share a list with"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_list_with(id));

create policy "profiles: update self"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- lists
-- ---------------------------------------------------------------------------
alter table public.lists enable row level security;

grant select on public.lists to authenticated;
grant insert (id, name, emoji, color, owner_id) on public.lists to authenticated;
grant update (name, emoji, color, deleted_at) on public.lists to authenticated;

create policy "lists: members read"
  on public.lists for select to authenticated
  using (public.is_list_member(id) or owner_id = (select auth.uid()));

create policy "lists: create your own"
  on public.lists for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "lists: owner updates and soft-deletes"
  on public.lists for update to authenticated
  using (public.list_role(id) = 'owner')
  with check (public.list_role(id) = 'owner');

-- ---------------------------------------------------------------------------
-- list_members (no insert or delete grants at all)
-- ---------------------------------------------------------------------------
alter table public.list_members enable row level security;

grant select on public.list_members to authenticated;
grant update (role, notify_level, deleted_at) on public.list_members to authenticated;

-- You can always see your own membership rows, even after removal, so your device can detect
-- lost access and clear local data and widgets.
create policy "list_members: members read; you read your own"
  on public.list_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_list_member(list_id));

-- Fine-grained rules (roles, notify_level, leave/remove) live in guard_member_update.
create policy "list_members: owner manages, members update themselves"
  on public.list_members for update to authenticated
  using (
    public.is_list_member(list_id)
    and (user_id = (select auth.uid()) or public.list_role(list_id) = 'owner')
  )
  with check (
    user_id = (select auth.uid()) or public.list_role(list_id) = 'owner'
  );

-- ---------------------------------------------------------------------------
-- invites (owner only; tokens are secrets)
-- ---------------------------------------------------------------------------
alter table public.invites enable row level security;

grant select on public.invites to authenticated;
grant insert (list_id, role, expires_at, max_uses) on public.invites to authenticated;
grant update (expires_at, max_uses, deleted_at) on public.invites to authenticated;

create policy "invites: owner reads"
  on public.invites for select to authenticated
  using (public.list_role(list_id) = 'owner');

create policy "invites: owner creates"
  on public.invites for insert to authenticated
  with check (
    public.list_role(list_id) = 'owner'
    and created_by = (select auth.uid())
    and expires_at <= now() + interval '30 days'
  );

create policy "invites: owner revokes or edits"
  on public.invites for update to authenticated
  using (public.list_role(list_id) = 'owner')
  with check (public.list_role(list_id) = 'owner');

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;

grant select on public.tasks to authenticated;
grant insert (id, list_id, title, is_done, done_at, position, due_at, priority, deleted_at)
  on public.tasks to authenticated;
grant update (title, is_done, done_at, position, due_at, priority, deleted_at)
  on public.tasks to authenticated;

create policy "tasks: members read"
  on public.tasks for select to authenticated
  using (public.is_list_member(list_id));

create policy "tasks: editors create"
  on public.tasks for insert to authenticated
  with check (public.can_edit_list(list_id));

create policy "tasks: editors update"
  on public.tasks for update to authenticated
  using (public.can_edit_list(list_id))
  with check (public.can_edit_list(list_id));

-- ---------------------------------------------------------------------------
-- task_notes
-- ---------------------------------------------------------------------------
alter table public.task_notes enable row level security;

grant select on public.task_notes to authenticated;
-- list_id is included so clients may send it; the trigger always overwrites it from the task.
grant insert (task_id, list_id, content, deleted_at) on public.task_notes to authenticated;
grant update (content, deleted_at) on public.task_notes to authenticated;

create policy "task_notes: members read"
  on public.task_notes for select to authenticated
  using (public.is_list_member(list_id));

-- The insert check uses the task's list (list_id is set by trigger before the check runs).
create policy "task_notes: editors create"
  on public.task_notes for insert to authenticated
  with check (public.can_edit_list(list_id));

create policy "task_notes: editors update"
  on public.task_notes for update to authenticated
  using (public.can_edit_list(list_id))
  with check (public.can_edit_list(list_id));

-- ---------------------------------------------------------------------------
-- Helper functions: callable by signed-in users only.
-- ---------------------------------------------------------------------------
revoke execute on function public.list_role(uuid), public.is_list_member(uuid),
  public.can_edit_list(uuid), public.shares_list_with(uuid)
  from public, anon;
grant execute on function public.list_role(uuid), public.is_list_member(uuid),
  public.can_edit_list(uuid), public.shares_list_with(uuid)
  to authenticated;
