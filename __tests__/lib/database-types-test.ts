import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Enums, Tables, TablesInsert } from '@/lib/database.types';

type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

/**
 * Compile-time checks that the client types follow the column grants in 0006_rls.sql.
 * Never executed: `npm run typecheck` fails if a narrowing is lost (each @ts-expect-error
 * must still be an error) or if an allowed call stops compiling.
 */
function grantTypeChecks(db: SupabaseClient<Database>): void {
  // profiles: private / server-only columns are not part of the readable row.
  const pushTokens: HasKey<Tables<'profiles'>, 'push_tokens'> = false;
  const profileUpdatedBy: HasKey<Tables<'profiles'>, 'updated_by'> = false;
  void [pushTokens, profileUpdatedBy];

  // @ts-expect-error profiles are created by the sign-up trigger, never by clients
  void db.from('profiles').insert({ id: 'u', display_name: 'A' });
  // @ts-expect-error list_members rows are created by the join Edge Function only
  void db.from('list_members').insert({ list_id: 'l', user_id: 'u', role: 'editor' });
  // @ts-expect-error tasks.version is server-owned
  void db.from('tasks').update({ version: 2 });
  // @ts-expect-error invites.token is generated server-side
  void db.from('invites').insert({ list_id: 'l', token: 't' });

  // Allowed writes keep compiling. task_notes.list_id is optional (filled by a trigger).
  const note: TablesInsert<'task_notes'> = { task_id: 't', content: {} };
  void db.from('task_notes').insert(note);
  void db.from('profiles').update({ display_name: 'A', onboarded_at: null });
  void db.from('tasks').insert({ list_id: 'l', title: 'Milk', position: 'a0' });

  // list_role() returns null for non-members.
  void db.rpc('list_role', { p_list_id: 'l' }).then(({ data }) => {
    const role: Enums<'member_role'> | null = data;
    return role;
  });
}

describe('database.types', () => {
  it('is checked at compile time by npm run typecheck', () => {
    expect(typeof grantTypeChecks).toBe('function');
  });
});
