-- Non-members and anonymous users can read nothing; members read their lists; push tokens stay private.
select * from no_plan();

-- Outsider -----------------------------------------------------------------
select pg_temp.login_as('00000000-0000-4000-a000-000000000004');

select is((select count(*)::int from public.lists where id = '10000000-0000-4000-a000-000000000001'), 0,
  'outsider cannot see a list they are not on');
select is((select count(*)::int from public.tasks where list_id = '10000000-0000-4000-a000-000000000001'), 0,
  'outsider cannot see its tasks');
select is((select count(*)::int from public.task_notes where list_id = '10000000-0000-4000-a000-000000000001'), 0,
  'outsider cannot see its notes');
select is((select count(*)::int from public.list_members where list_id = '10000000-0000-4000-a000-000000000001'), 0,
  'outsider cannot see its members');
select is((select count(*)::int from public.invites), 0,
  'outsider sees no invites');
select is((select count(*)::int from public.profiles where id = '00000000-0000-4000-a000-000000000001'), 0,
  'outsider cannot see the profile of someone they share no list with');
select is((select count(*)::int from public.lists where id = '10000000-0000-4000-a000-000000000002'), 1,
  'outsider sees their own list');
select is((select display_name from public.profiles where id = '00000000-0000-4000-a000-000000000004'), 'Xavier Outsider',
  'profile was created from OAuth metadata and is readable by its owner');

-- Viewer (a member) --------------------------------------------------------
select pg_temp.login_as('00000000-0000-4000-a000-000000000003');

select is((select count(*)::int from public.lists where id = '10000000-0000-4000-a000-000000000001'), 1,
  'viewer sees the list');
select is((select count(*)::int from public.tasks where list_id = '10000000-0000-4000-a000-000000000001'), 2,
  'viewer sees its tasks');
select is((select count(*)::int from public.task_notes where list_id = '10000000-0000-4000-a000-000000000001'), 1,
  'viewer sees its notes');
select is((select count(*)::int from public.list_members where list_id = '10000000-0000-4000-a000-000000000001'), 3,
  'viewer sees all members');
select is((select display_name from public.profiles where id = '00000000-0000-4000-a000-000000000001'), 'Olivia Owner',
  'members can read each other''s public profile');
select is((select count(*)::int from public.lists where id = '10000000-0000-4000-a000-000000000002'), 0,
  'viewer cannot see an unrelated list');

-- push_tokens is private, even for your own row (managed server-side only)
select throws_ok(
  $$ select push_tokens from public.profiles where id = '00000000-0000-4000-a000-000000000001' $$,
  '42501', null, 'push_tokens of another member are not readable');
select throws_ok(
  $$ select push_tokens from public.profiles where id = '00000000-0000-4000-a000-000000000003' $$,
  '42501', null, 'push_tokens are not readable by clients at all');
select throws_ok(
  $$ update public.profiles set push_tokens = '{}' where id = '00000000-0000-4000-a000-000000000003' $$,
  '42501', null, 'push_tokens are not writable by clients');

-- Profiles: update self only
select results_eq(
  $$ with u as (update public.profiles set display_name = 'Hacked' where id = '00000000-0000-4000-a000-000000000001' returning 1)
     select count(*)::int from u $$,
  $$ values (0) $$, 'cannot update someone else''s profile');
select results_eq(
  $$ with u as (update public.profiles set display_name = 'Vera V.' where id = '00000000-0000-4000-a000-000000000003' returning 1)
     select count(*)::int from u $$,
  $$ values (1) $$, 'can update own profile');

-- Anonymous ------------------------------------------------------------------
select pg_temp.login_anon();
select throws_ok($$ select * from public.tasks $$, '42501', null, 'anon has no access to tasks');
select throws_ok($$ select * from public.lists $$, '42501', null, 'anon has no access to lists');
select throws_ok($$ select id from public.profiles $$, '42501', null, 'anon has no access to profiles');

select pg_temp.logout();
select * from finish();
