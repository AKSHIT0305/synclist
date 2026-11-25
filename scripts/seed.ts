/**
 * Seeds the DEV project with demo users, two shared lists, tasks and a note. Idempotent.
 *
 *   npm run db:seed
 *   npm run db:seed -- --member you@gmail.com   # also add your (already signed-in) account to both lists
 *
 * Uses the service-role key, which bypasses RLS. Never point this at production.
 */
import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.');
  process.exit(2);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_USERS = [
  { email: 'riya.demo@synclist.dev', name: 'Riya (demo)' },
  { email: 'sam.demo@synclist.dev', name: 'Sam (demo)' },
] as const;

const LISTS = [
  { id: '5eed0000-0000-4000-a000-000000000001', name: 'Groceries', emoji: '🛒', color: '#22A06B' },
  { id: '5eed0000-0000-4000-a000-000000000002', name: 'Goa trip', emoji: '🏖️', color: '#F5A524' },
] as const;

function check<T>(result: { data: T; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureDemoUser(email: string, name: string): Promise<string> {
  const existing = await findUserIdByEmail(email);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  return data.user.id;
}

async function main(): Promise<void> {
  const memberFlag = process.argv.indexOf('--member');
  const memberEmail = memberFlag >= 0 ? process.argv[memberFlag + 1] : undefined;

  const [riya, sam] = await Promise.all(DEMO_USERS.map((u) => ensureDemoUser(u.email, u.name)));
  if (!riya || !sam) throw new Error('demo users missing');

  check(
    await admin
      .from('profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .in('id', [riya, sam]),
    'mark demo profiles onboarded',
  );

  // Riya owns both lists (the owner membership row is added by the lists_add_owner trigger).
  check(
    await admin.from('lists').upsert(
      LISTS.map((l) => ({ ...l, owner_id: riya })),
      { onConflict: 'id', ignoreDuplicates: true },
    ),
    'upsert lists',
  );

  const members: { list_id: string; user_id: string; role: 'editor' | 'viewer' }[] = [
    { list_id: LISTS[0].id, user_id: sam, role: 'editor' },
    { list_id: LISTS[1].id, user_id: sam, role: 'viewer' },
  ];

  if (memberEmail) {
    const you = await findUserIdByEmail(memberEmail);
    if (!you) throw new Error(`${memberEmail} has not signed in to the app yet`);
    members.push(
      { list_id: LISTS[0].id, user_id: you, role: 'editor' },
      { list_id: LISTS[1].id, user_id: you, role: 'editor' },
    );
  }

  check(
    await admin
      .from('list_members')
      .upsert(members, { onConflict: 'list_id,user_id', ignoreDuplicates: true }),
    'upsert members',
  );

  const tasks = [
    ['5eed1000-0000-4000-a000-000000000001', LISTS[0].id, 'Milk', 'a0'],
    ['5eed1000-0000-4000-a000-000000000002', LISTS[0].id, 'Bread', 'a1'],
    ['5eed1000-0000-4000-a000-000000000003', LISTS[0].id, 'Eggs (12)', 'a2'],
    ['5eed1000-0000-4000-a000-000000000004', LISTS[0].id, 'Coffee beans', 'a3'],
    ['5eed1000-0000-4000-a000-000000000005', LISTS[1].id, 'Book train tickets', 'a0'],
    ['5eed1000-0000-4000-a000-000000000006', LISTS[1].id, 'Sunscreen', 'a1'],
  ].map(([id, list_id, title, position]) => ({ id, list_id, title, position, created_by: riya }));

  check(
    await admin.from('tasks').upsert(tasks, { onConflict: 'id', ignoreDuplicates: true }),
    'upsert tasks',
  );

  check(
    await admin.from('task_notes').upsert(
      {
        task_id: '5eed1000-0000-4000-a000-000000000001',
        list_id: LISTS[0].id,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '2 litres, toned' }] }],
        },
      },
      { onConflict: 'task_id', ignoreDuplicates: true },
    ),
    'upsert note',
  );

  console.log(
    `Seeded ${LISTS.length} lists, ${tasks.length} tasks for ${DEMO_USERS.length} demo users` +
      (memberEmail ? ` and added ${memberEmail}.` : '.'),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
