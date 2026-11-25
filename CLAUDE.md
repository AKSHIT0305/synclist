@AGENTS.md

## SyncList project rules

- TypeScript strict, no `any`. Business logic (sync, conflict merge, ordering, outbox) goes in pure, unit-tested functions.
- Every database change goes in a new numbered migration under `supabase/migrations/` (`NNNN_name.sql`). Never edit an applied migration, and never change the DB by hand.
- RLS changes need pgTAP coverage in `supabase/tests/` (`npm run test:rls`).
- Run `npm run check` (typecheck + lint + jest) before declaring work done.
- Secrets live only in `.env`, which is git-ignored. Keep `.env.example` up to date.
- Update `README.md` at the end of each phase. Make small, focused commits.
- Work phase by phase. Plan each phase first and wait for approval.
