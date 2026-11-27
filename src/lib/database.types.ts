/**
 * Client-facing database types: the generated schema narrowed to what the app is allowed to do.
 *
 * `database.generated.ts` is the raw output of `npm run db:types` (never edit it). It sees tables
 * and columns, but not the column-level GRANTs in supabase/migrations/0006_rls.sql, so on its own
 * it would let the app type-check reads and writes that Postgres rejects with "permission denied".
 *
 * This file picks only the granted columns from it. If a migration renames or drops a column that
 * is listed here, regenerating makes `npm run typecheck` fail until this file is updated.
 * When a migration changes a GRANT, update the matching column list below in the same PR.
 */
import type { Database as Generated } from './database.generated';

export type { Json } from './database.generated';

type G = Generated['public'];
type TableName = keyof G['Tables'];
type Row<T extends TableName> = G['Tables'][T]['Row'];
type Insert<T extends TableName> = G['Tables'][T]['Insert'];
type Update<T extends TableName> = G['Tables'][T]['Update'];
type Rels<T extends TableName> = G['Tables'][T]['Relationships'];

/** Makes the keys K optional (for columns that a trigger fills in). */
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Column grants for the `authenticated` role (0006_rls.sql). Tables with a whole-table
// `grant select` expose the full generated Row.

/** profiles: push_tokens and updated_by are not readable by clients. Rows come from the sign-up trigger. */
type ProfileSelect =
  | 'id'
  | 'display_name'
  | 'avatar_url'
  | 'onboarded_at'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at';
type ProfileUpdate = 'display_name' | 'avatar_url' | 'onboarded_at';

type ListInsert = 'id' | 'name' | 'emoji' | 'color' | 'owner_id';
type ListUpdate = 'name' | 'emoji' | 'color' | 'deleted_at';

/** list_members: no insert grant. Joining goes through an Edge Function (Phase 3). */
type ListMemberUpdate = 'role' | 'notify_level' | 'deleted_at';

type InviteInsert = 'list_id' | 'role' | 'expires_at' | 'max_uses';
type InviteUpdate = 'expires_at' | 'max_uses' | 'deleted_at';

type TaskInsert =
  | 'id'
  | 'list_id'
  | 'title'
  | 'is_done'
  | 'done_at'
  | 'position'
  | 'due_at'
  | 'priority'
  | 'deleted_at';
type TaskUpdate =
  'title' | 'is_done' | 'done_at' | 'position' | 'due_at' | 'priority' | 'deleted_at';

/** task_notes.list_id may be sent but is always overwritten from the task by a trigger. */
type TaskNoteInsert = 'task_id' | 'list_id' | 'content' | 'deleted_at';
type TaskNoteUpdate = 'content' | 'deleted_at';

export type Database = {
  __InternalSupabase: Generated['__InternalSupabase'];
  public: {
    Tables: {
      profiles: {
        Row: Pick<Row<'profiles'>, ProfileSelect>;
        Insert: never;
        Update: Pick<Update<'profiles'>, ProfileUpdate>;
        Relationships: Rels<'profiles'>;
      };
      lists: {
        Row: Row<'lists'>;
        Insert: Pick<Insert<'lists'>, ListInsert>;
        Update: Pick<Update<'lists'>, ListUpdate>;
        Relationships: Rels<'lists'>;
      };
      list_members: {
        Row: Row<'list_members'>;
        Insert: never;
        Update: Pick<Update<'list_members'>, ListMemberUpdate>;
        Relationships: Rels<'list_members'>;
      };
      invites: {
        Row: Row<'invites'>;
        Insert: Pick<Insert<'invites'>, InviteInsert>;
        Update: Pick<Update<'invites'>, InviteUpdate>;
        Relationships: Rels<'invites'>;
      };
      tasks: {
        Row: Row<'tasks'>;
        Insert: Pick<Insert<'tasks'>, TaskInsert>;
        Update: Pick<Update<'tasks'>, TaskUpdate>;
        Relationships: Rels<'tasks'>;
      };
      task_notes: {
        Row: Row<'task_notes'>;
        Insert: Optional<Pick<Insert<'task_notes'>, TaskNoteInsert>, 'list_id'>;
        Update: Pick<Update<'task_notes'>, TaskNoteUpdate>;
        Relationships: Rels<'task_notes'>;
      };
    };
    Views: G['Views'];
    Functions: Omit<G['Functions'], 'list_role'> & {
      // Returns null when the caller is not a member; the generator can't express that.
      list_role: {
        Args: G['Functions']['list_role']['Args'];
        Returns: G['Enums']['member_role'] | null;
      };
    };
    Enums: G['Enums'];
    CompositeTypes: G['CompositeTypes'];
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
