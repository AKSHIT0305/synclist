# src/sync

Sync engine, arriving in **Phase 3**:

- the outbox worker, which sends pending writes in order and retries with exponential backoff
- delta sync on launch and on reconnect
- Realtime subscriptions and presence
- the conflict rules from the brief, as pure, unit-tested functions:
  - last write wins per field
  - delete beats done
  - two-sided prompt for notes
  - fractional reorder
