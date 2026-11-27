export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      invites: {
        Row: {
          created_at: string;
          created_by: string;
          deleted_at: string | null;
          expires_at: string;
          id: string;
          list_id: string;
          max_uses: number | null;
          role: Database['public']['Enums']['member_role'];
          token: string;
          updated_at: string;
          updated_by: string | null;
          uses: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          expires_at?: string;
          id?: string;
          list_id: string;
          max_uses?: number | null;
          role?: Database['public']['Enums']['member_role'];
          token?: string;
          updated_at?: string;
          updated_by?: string | null;
          uses?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          deleted_at?: string | null;
          expires_at?: string;
          id?: string;
          list_id?: string;
          max_uses?: number | null;
          role?: Database['public']['Enums']['member_role'];
          token?: string;
          updated_at?: string;
          updated_by?: string | null;
          uses?: number;
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
      list_members: {
        Row: {
          deleted_at: string | null;
          joined_at: string;
          list_id: string;
          notify_level: Database['public']['Enums']['notify_level'];
          role: Database['public']['Enums']['member_role'];
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          deleted_at?: string | null;
          joined_at?: string;
          list_id: string;
          notify_level?: Database['public']['Enums']['notify_level'];
          role: Database['public']['Enums']['member_role'];
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          deleted_at?: string | null;
          joined_at?: string;
          list_id?: string;
          notify_level?: Database['public']['Enums']['notify_level'];
          role?: Database['public']['Enums']['member_role'];
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
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
      lists: {
        Row: {
          color: string;
          created_at: string;
          deleted_at: string | null;
          emoji: string;
          id: string;
          name: string;
          owner_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          color?: string;
          created_at?: string;
          deleted_at?: string | null;
          emoji?: string;
          id?: string;
          name: string;
          owner_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          color?: string;
          created_at?: string;
          deleted_at?: string | null;
          emoji?: string;
          id?: string;
          name?: string;
          owner_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          display_name: string;
          id: string;
          onboarded_at: string | null;
          push_tokens: string[];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string;
          id: string;
          onboarded_at?: string | null;
          push_tokens?: string[];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string;
          id?: string;
          onboarded_at?: string | null;
          push_tokens?: string[];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      task_notes: {
        Row: {
          content: Json;
          created_at: string;
          deleted_at: string | null;
          list_id: string;
          task_id: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          deleted_at?: string | null;
          list_id: string;
          task_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          content?: Json;
          created_at?: string;
          deleted_at?: string | null;
          list_id?: string;
          task_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'task_notes_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'task_notes_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: true;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          done_at: string | null;
          done_by: string | null;
          due_at: string | null;
          id: string;
          is_done: boolean;
          list_id: string;
          position: string;
          priority: Database['public']['Enums']['task_priority'];
          title: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_at?: string | null;
          id?: string;
          is_done?: boolean;
          list_id: string;
          position: string;
          priority?: Database['public']['Enums']['task_priority'];
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          done_at?: string | null;
          done_by?: string | null;
          due_at?: string | null;
          id?: string;
          is_done?: boolean;
          list_id?: string;
          position?: string;
          priority?: Database['public']['Enums']['task_priority'];
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_edit_list: { Args: { p_list_id: string }; Returns: boolean };
      is_list_member: { Args: { p_list_id: string }; Returns: boolean };
      list_role: {
        Args: { p_list_id: string };
        Returns: Database['public']['Enums']['member_role'];
      };
      shares_list_with: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: {
      member_role: 'owner' | 'editor' | 'viewer';
      notify_level: 'all' | 'assigned_to_me' | 'my_tasks' | 'none';
      task_priority: 'none' | 'low' | 'medium' | 'high';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_role: ['owner', 'editor', 'viewer'],
      notify_level: ['all', 'assigned_to_me', 'my_tasks', 'none'],
      task_priority: ['none', 'low', 'medium', 'high'],
    },
  },
} as const;
