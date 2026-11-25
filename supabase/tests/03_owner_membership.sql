-- Owners can do everything; role/leave/remove rules; removed members lose access but see their removal.
select * from no_plan();

select pg_temp.login_as('00000000-0000-4000-a000-000000000001');

select results_eq(
  $$ with u as (update public.lists set name = 'Weekly groceries', color = '#FF5722'
       where id = '10000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'owner can edit the list');
select throws_ok(
  $$ update public.lists set owner_id = '00000000-0000-4000-a000-000000000002' where id = '10000000-0000-4000-a000-000000000001' $$,
  '42501', null, 'owner_id cannot be changed by clients');

select results_eq(
  $$ with u as (update public.list_members set role = 'editor'
       where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'owner can change a member''s role');
select throws_ok(
  $$ update public.list_members set role = 'owner'
     where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000002' $$,
  'SL403', null, 'ownership cannot be granted through a role change');
select throws_ok(
  $$ update public.list_members set notify_level = 'none'
     where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000002' $$,
  'SL403', null, 'owner cannot change another member''s notification setting');
select throws_ok(
  $$ update public.list_members set deleted_at = now()
     where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000001' $$,
  'SL403', null, 'owner cannot leave without transferring ownership');

-- Invites
select lives_ok(
  $$ insert into public.invites (list_id, role) values ('10000000-0000-4000-a000-000000000001', 'viewer') $$,
  'owner can create an invite');
select is((select char_length(token) from public.invites where list_id = '10000000-0000-4000-a000-000000000001'), 32,
  'invite token is 32 url-safe chars');
select matches((select token from public.invites where list_id = '10000000-0000-4000-a000-000000000001'), '^[A-Za-z0-9_-]{32}$',
  'invite token is base64url');
select is((select expires_at::date from public.invites where list_id = '10000000-0000-4000-a000-000000000001'),
  (now() + interval '7 days')::date, 'invite expires in 7 days by default');
select throws_ok(
  $$ insert into public.invites (list_id, role) values ('10000000-0000-4000-a000-000000000001', 'owner') $$,
  '23514', null, 'an invite can never grant owner');
select throws_ok(
  $$ insert into public.invites (list_id, token) values ('10000000-0000-4000-a000-000000000001', 'guessable') $$,
  '42501', null, 'clients cannot choose the token');

-- Remove the (now editor) member V
select results_eq(
  $$ with u as (update public.list_members set deleted_at = now()
       where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'owner can remove a member');

-- Removed member: no access to the list, but can see their own (soft-deleted) membership row
select pg_temp.login_as('00000000-0000-4000-a000-000000000003');
select is((select count(*)::int from public.lists where id = '10000000-0000-4000-a000-000000000001'), 0,
  'removed member can no longer see the list');
select is((select count(*)::int from public.tasks where list_id = '10000000-0000-4000-a000-000000000001'), 0,
  'removed member can no longer see tasks');
select isnt((select deleted_at from public.list_members
  where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003'), null,
  'removed member can see their own removal (so the device can clear local data)');
select results_eq(
  $$ with u as (update public.list_members set deleted_at = null
       where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000003' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'removed member cannot re-add themself');

-- Editor leaves on their own
select pg_temp.login_as('00000000-0000-4000-a000-000000000002');
select results_eq(
  $$ with u as (update public.list_members set notify_level = 'none'
       where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000002' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'member can change their own notification setting');
select results_eq(
  $$ with u as (update public.list_members set deleted_at = now()
       where list_id = '10000000-0000-4000-a000-000000000001' and user_id = '00000000-0000-4000-a000-000000000002' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'member can leave a list');
select throws_ok(
  $$ insert into public.tasks (list_id, title, position) values ('10000000-0000-4000-a000-000000000001', 'After leaving', 'b0') $$,
  '42501', null, 'a member who left can no longer write');

-- Owner soft-deletes the list; nobody can write to it afterwards
select pg_temp.login_as('00000000-0000-4000-a000-000000000001');
select results_eq(
  $$ with u as (update public.lists set deleted_at = now() where id = '10000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'owner can delete the list');
select throws_ok(
  $$ delete from public.lists where id = '10000000-0000-4000-a000-000000000001' $$,
  '42501', null, 'lists are never hard-deleted by clients');
select is((select count(*)::int from public.lists where id = '10000000-0000-4000-a000-000000000001' and deleted_at is not null), 1,
  'owner still sees the deleted list (for sync)');
select throws_ok(
  $$ insert into public.tasks (list_id, title, position) values ('10000000-0000-4000-a000-000000000001', 'Too late', 'c0') $$,
  '42501', null, 'no task writes on a deleted list');

select pg_temp.logout();
select * from finish();
