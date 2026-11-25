-- Viewers can't write; editors write tasks and notes but not lists, roles, invites or members.
select * from no_plan();

-- Viewer -----------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-4000-a000-000000000003');

select throws_ok(
  $$ insert into public.tasks (list_id, title, position) values ('10000000-0000-4000-a000-000000000001', 'Eggs', 'a2') $$,
  '42501', null, 'viewer cannot create tasks');
select results_eq(
  $$ with u as (update public.tasks set title = 'Oat milk' where id = '20000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'viewer cannot edit tasks');
select results_eq(
  $$ with u as (update public.tasks set is_done = true where id = '20000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'viewer cannot complete tasks');
select results_eq(
  $$ with u as (update public.tasks set deleted_at = now() where id = '20000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'viewer cannot delete tasks');
select throws_ok(
  $$ delete from public.tasks where id = '20000000-0000-4000-a000-000000000001' $$,
  '42501', null, 'nobody can hard-delete tasks');
select throws_ok(
  $$ insert into public.task_notes (task_id, content) values ('20000000-0000-4000-a000-000000000002', '{}') $$,
  '42501', null, 'viewer cannot create notes');
select results_eq(
  $$ with u as (update public.task_notes set content = '{}' where task_id = '20000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'viewer cannot edit notes');
select throws_ok(
  $$ update public.list_members set role = 'editor'
     where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003' $$,
  'SL403', null, 'viewer cannot promote themself');
select throws_ok(
  $$ insert into public.list_members (list_id, user_id, role)
     values ('10000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003', 'owner') $$,
  '42501', null, 'clients can never insert memberships directly');

select pg_temp.logout();
select is((select title from public.tasks where id = '20000000-0000-4000-a000-000000000001'), 'Milk',
  'task is unchanged after viewer attempts');

-- Editor -----------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-4000-a000-000000000002');

select lives_ok(
  $$ insert into public.tasks (id, list_id, title, position)
     values ('20000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000001', 'Eggs', 'a2') $$,
  'editor can create a task with a client-generated id');
select is((select created_by from public.tasks where id = '20000000-0000-4000-a000-000000000003'),
  '00000000-0000-4000-a000-000000000002'::uuid, 'created_by is set from the JWT');
select throws_ok(
  $$ insert into public.tasks (list_id, title, position, created_by)
     values ('10000000-0000-4000-a000-000000000001', 'Forged', 'a3', '00000000-0000-4000-a000-000000000001') $$,
  '42501', null, 'created_by cannot be forged');
select throws_ok(
  $$ insert into public.tasks (list_id, title, position) values ('10000000-0000-4000-a000-000000000002', 'Sneaky', 'a0') $$,
  '42501', null, 'editor cannot add tasks to a list they are not on');

select results_eq(
  $$ with u as (update public.tasks set is_done = true where id = '20000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'editor can complete a task');
select is((select done_by from public.tasks where id = '20000000-0000-4000-a000-000000000001'),
  '00000000-0000-4000-a000-000000000002'::uuid, 'done_by is set to the editor');
select isnt((select done_at from public.tasks where id = '20000000-0000-4000-a000-000000000001'), null,
  'done_at is set');
select is((select version from public.tasks where id = '20000000-0000-4000-a000-000000000001'), 2,
  'version is bumped on write');
select lives_ok(
  $$ update public.tasks set is_done = false where id = '20000000-0000-4000-a000-000000000001' $$,
  'editor can uncomplete a task');
select is((select done_by from public.tasks where id = '20000000-0000-4000-a000-000000000001'), null,
  'uncompleting clears done_by');

select lives_ok(
  $$ insert into public.task_notes (task_id, content) values ('20000000-0000-4000-a000-000000000003', '{"type":"doc","content":[]}') $$,
  'editor can create a note');
select is((select list_id from public.task_notes where task_id = '20000000-0000-4000-a000-000000000003'),
  '10000000-0000-4000-a000-000000000001'::uuid, 'note list_id is derived from its task');
select is((select updated_by from public.task_notes where task_id = '20000000-0000-4000-a000-000000000003'),
  '00000000-0000-4000-a000-000000000002'::uuid, 'note updated_by is the editor');

select throws_ok(
  $$ update public.tasks set list_id = '10000000-0000-4000-a000-000000000002' where id = '20000000-0000-4000-a000-000000000001' $$,
  '42501', null, 'tasks cannot be moved to another list');
select results_eq(
  $$ with u as (update public.lists set name = 'Renamed' where id = '10000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'editor cannot rename the list');
select results_eq(
  $$ with u as (update public.lists set deleted_at = now() where id = '10000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'editor cannot delete the list');
select results_eq(
  $$ with u as (update public.list_members set role = 'editor'
       where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'editor cannot change someone else''s role');
select results_eq(
  $$ with u as (update public.list_members set deleted_at = now()
       where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'editor cannot remove other members');
select throws_ok(
  $$ insert into public.invites (list_id, role) values ('10000000-0000-4000-a000-000000000001', 'editor') $$,
  '42501', null, 'editor cannot create invites');

select pg_temp.logout();
select is((select role::text from public.list_members
  where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003'),
  'viewer', 'viewer role is unchanged');
select * from finish();
