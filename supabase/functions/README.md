# supabase/functions

Edge Functions (Deno), added in later phases:

- `join-list` (**Phase 3**): validates an invite token and inserts the `list_members` row. This is the only way to join a list.
- `notify-members` (**Phase 4**): called by a database trigger. It sends silent data pushes so the other members' widgets refresh.
