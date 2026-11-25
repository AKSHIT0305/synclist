-- Shared fixtures, prepended to every test file by scripts/run-sql-tests.ts.
-- Everything runs inside BEGIN ... ROLLBACK, so nothing is left behind.
--
-- Cast:
--   owner    O  ...0001  owns list L ("Groceries")
--   editor   E  ...0002  editor on L
--   viewer   V  ...0003  viewer on L
--   outsider X  ...0004  not on L; owns list L2 ("Trip")

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@test.synclist',    '{"full_name":"Olivia Owner"}',   '{}', now(), now()),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'editor@test.synclist',   '{"full_name":"Eddie Editor"}',   '{}', now(), now()),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer@test.synclist',   '{"full_name":"Vera Viewer"}',    '{}', now(), now()),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@test.synclist', '{"full_name":"Xavier Outsider"}', '{}', now(), now());

update public.profiles set push_tokens = array['ExponentPushToken[secret]'];

insert into public.lists (id, name, emoji, owner_id) values
  ('10000000-0000-4000-a000-000000000001', 'Groceries', '🛒', '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000002', 'Trip',      '🧳', '00000000-0000-4000-a000-000000000004');

insert into public.list_members (list_id, user_id, role) values
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', 'editor'),
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000003', 'viewer');

insert into public.tasks (id, list_id, title, position, created_by) values
  ('20000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'Milk',  'a0', '00000000-0000-4000-a000-000000000001'),
  ('20000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', 'Bread', 'a1', '00000000-0000-4000-a000-000000000001');

insert into public.task_notes (task_id, content) values
  ('20000000-0000-4000-a000-000000000001', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"2 litres"}]}]}');

-- Switch the current identity, exactly as PostgREST does for a signed-in request.
create function pg_temp.login_as(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create function pg_temp.login_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end;
$$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'none', true);
end;
$$;
