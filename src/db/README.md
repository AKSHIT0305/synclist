# src/db

Local, offline-first storage (expo-sqlite), arriving in **Phase 2**:

- a schema that mirrors the server tables (`lists`, `list_members`, `tasks`, `task_notes`, `profiles`)
- an `outbox` table of pending writes
- a repository layer that the UI reads from (the UI never reads Supabase directly)
