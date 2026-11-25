/**
 * Database types in the format produced by `supabase gen types typescript`.
 * Hand-written for Phase 1 to mirror supabase/migrations; regenerate with
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 * once the project is linked, and keep it in sync with every migration.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type MemberRole = 'owner' | 'editor' | 'viewer';
type NotifyLevel = 'all' | 'assigned_to_me' | 'my_tasks' | 'none';
type TaskPriority = 'none' | 'low' | 'medium' | 'high';

export type Database = {
  public: {
    Tables: {
      profiles: {
        // push_tokens exists in the table but is not readable by clients (column grants).
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: never;
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          onboarded_at?: string | null;
        };
        Relationships: [];
      };
      lists: {
        Row: {
          id: string;
          name: string;
          emoji: string;
          color: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          emoji?: string;
          color?: string;
          owner_id?: string;
        };
        Update: {
          name?: string;
          emoji?: string;
          color?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      list_members: {
        Row: {
          list_id: string;
          user_id: string;
          role: MemberRole;
          notify_level: NotifyLevel;
          joined_at: string;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: never;
        Update: {
          role?: MemberRole;
          notify_level?: NotifyLevel;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'list_members_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'lists';
            referencedColumns: ['id'];
          },
        ];
      };
      invites: {
        Row: {
          id: string;
          list_id: string;
          token: string;
          role: MemberRole;
          created_by: string;
          created_at: string;
          expires_at: string;
          max_uses: number | null;
          uses: number;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          list_id: string;
          role?: MemberRole;
          expires_at?: string;
          max_uses?: number | null;
        };
        Update: {
          expires_at?: string;
          max_uses?: number | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invites_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'lists';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          list_id: string;
          title: string;
          is_done: boolean;
          done_by: string | null;
          done_at: string | null;
          position: string;
          due_at: string | null;
          priority: TaskPriority;
          created_by: string | null;
          created_at: string;
          version: number;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          list_id: string;
          title: string;
          is_done?: boolean;
          done_at?: string | null;
          position: string;
          due_at?: string | null;
          priority?: TaskPriority;
          deleted_at?: string | null;
        };
        Update: {
          title?: string;
          is_done?: boolean;
          done_at?: string | null;
          position?: string;
          due_at?: string | null;
          priority?: TaskPriority;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'lists';
            referencedColumns: ['id'];
          },
        ];
      };
      task_notes: {
        Row: {
          task_id: string;
          list_id: string;
          content: Json;
          created_at: string;
          version: number;
          updated_at: string;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          task_id: string;
          list_id?: string;
          content?: Json;
          deleted_at?: string | null;
        };
        Update: {
          content?: Json;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'task_notes_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: true;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      list_role: { Args: { p_list_id: string }; Returns: MemberRole | null };
      is_list_member: { Args: { p_list_id: string }; Returns: boolean };
      can_edit_list: { Args: { p_list_id: string }; Returns: boolean };
      shares_list_with: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: {
      member_role: MemberRole;
      notify_level: NotifyLevel;
      task_priority: TaskPriority;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
