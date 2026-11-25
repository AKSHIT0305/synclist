-- v1 limits: 20 invites/day, 50 members per list, 2,000 open tasks per list.
select * from no_plan();

-- Invite rate limit (outsider X owns list L2) ----------------------------------
select pg_temp.login_as('00000000-0000-4000-a000-000000000004');
select lives_ok(
  $$ insert into public.invites (list_id) select '10000000-0000-4000-a000-000000000002' from generate_series(1, 20) $$,
  '20 invites in a day are allowed');
select throws_ok(
  $$ insert into public.invites (list_id) values ('10000000-0000-4000-a000-000000000002') $$,
  'SL429', null, 'the 21st invite in 24 hours is rate limited');
select pg_temp.logout();

-- Member limit (L has 3 members; add 47 to reach 50) ---------------------------
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
select ('30000000-0000-4000-a000-' || lpad(i::text, 12, '0'))::uuid, '00000000-0000-0000-0000-000000000000',
       'authenticated', 'authenticated', 'member' || i || '@test.synclist', '{}', '{}', now(), now()
from generate_series(1, 48) as i;

select lives_ok(
  $$ insert into public.list_members (list_id, user_id, role)
     select '10000000-0000-4000-a000-000000000001', ('30000000-0000-4000-a000-' || lpad(i::text, 12, '0'))::uuid, 'viewer'
     from generate_series(1, 47) as i $$,
  'a list can reach 50 members');
select throws_ok(
  $$ insert into public.list_members (list_id, user_id, role)
     values ('10000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000048', 'viewer') $$,
  'SL413', null, 'the 51st member is rejected');

-- Open task limit (L2 has none) -------------------------------------------------
select lives_ok(
  $$ insert into public.tasks (list_id, title, position)
     select '10000000-0000-4000-a000-000000000002', 'Task ' || i, 'a' || lpad(i::text, 5, '0')
     from generate_series(1, 2000) as i $$,
  'a list can hold 2000 open tasks');
select throws_ok(
  $$ insert into public.tasks (list_id, title, position) values ('10000000-0000-4000-a000-000000000002', 'One more', 'b0') $$,
  'SL413', null, 'the 2001st open task is rejected');
select lives_ok(
  $$ insert into public.tasks (list_id, title, position, is_done) values ('10000000-0000-4000-a000-000000000002', 'Already done', 'b1', true) $$,
  'completed tasks do not count toward the limit');
select lives_ok(
  $$ update public.tasks set is_done = true where list_id = '10000000-0000-4000-a000-000000000002' and title = 'Task 1' $$,
  'completing a task frees a slot');
select lives_ok(
  $$ insert into public.tasks (list_id, title, position) values ('10000000-0000-4000-a000-000000000002', 'Fits now', 'b2') $$,
  'a new open task fits after one was completed');

select * from finish();
