# SyncList

SyncList is a shared to-do app that lives on your phone's home screen as a widget. It syncs in real time with everyone a list is shared with, and every task can have its own notes.

Built with Expo (SDK 58, dev build), TypeScript strict, Expo Router and Supabase. Android comes first; iOS follows after the Android launch.

---

## Status

| Phase | What                                                         | State                                              |
| ----- | ------------------------------------------------------------ | -------------------------------------------------- |
| 1     | Foundation: app shell, schema + RLS, Google sign-in, profile | ✅ built (see [Phase 1](#phase-1--what-was-built)) |
| 2     | Lists & tasks, single user, offline (SQLite)                 | ⏳ next                                            |
| 3     | Sync, sharing, invites, conflicts                            | —                                                  |
| 4     | Android widget (Jetpack Glance)                              | —                                                  |
| 5     | iOS widget (WidgetKit)                                       | —                                                  |
| 6     | v1.5 features                                                | —                                                  |

## Prerequisites

- **Node.js LTS.** Install it with `winget install OpenJS.NodeJS.LTS`.
- **An Expo account**, for EAS cloud builds. You don't need Android Studio, a JDK or Docker.
- **A Supabase project** (the free tier is fine). Use a separate `synclist-dev` project for development.
- **A Google Cloud project**, for the OAuth clients.
- **An Android phone** with USB debugging or "install unknown apps" allowed.

## 1. Install

```sh
npm install
cp .env.example .env      # then fill in the values (see below)
```

## 2. Supabase

1. Create a project at <https://supabase.com/dashboard>.
2. In **Project Settings → API**, copy:
   - the URL into `EXPO_PUBLIC_SUPABASE_URL`
   - the anon/publishable key into `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - the service-role key into `SUPABASE_SERVICE_ROLE_KEY` (this one is a secret)
3. In **Connect → Session pooler**, copy the URI into `SUPABASE_DB_URL`. This is used only by the RLS test runner.
4. Link the CLI and apply the migrations. The schema is only ever changed through numbered files in `supabase/migrations/`.

   ```sh
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --dry-run     # review
   npm run db:push
   ```

5. Run the RLS tests:

   ```sh
   npm run test:rls
   ```

   Each test file runs inside `BEGIN … ROLLBACK` with its own fixtures, so the database is left unchanged.

6. (Optional) Seed demo data:

   ```sh
   npm run db:seed
   npm run db:seed -- --member you@gmail.com   # after you've signed in once
   ```

## 3. Google sign-in

1. In **Google Cloud Console → APIs & Services → Credentials**, create an OAuth client of type **Web application**.
   - Copy its client ID into `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   - In **Supabase → Authentication → Sign In / Providers → Google**, enable the provider and paste in this client's ID and secret.
2. Create an OAuth client of type **Android**:
   - Package name: `com.akshit.synclist`
   - SHA-1 certificate fingerprint: the one from your EAS dev keystore. Get it with `npx eas-cli@latest credentials -p android` → _development_ → _Keystore_. The keystore is created on the first `eas build`.
3. If you add more Android clients later (for example for production signing), you don't need to change Supabase. Sign-in uses the Web client ID as the token audience.

> **Phone OTP** is built but switched off with `EXPO_PUBLIC_ENABLE_PHONE_OTP=false`. To turn it on, configure an SMS provider (Twilio or MSG91) in Supabase → Authentication → Phone, then set the flag to `true`.

## 4. Build and run on an Android phone

The app uses native modules (Google Sign-In, SecureStore, SQLite), so it runs in a **development build**, not Expo Go.

```sh
npx eas-cli@latest login
npx eas-cli@latest init                                   # creates the EAS project; put its id in EAS_PROJECT_ID
npx eas-cli@latest build --profile development --platform android
```

When the build finishes, open the link or QR code on your phone and install the APK. Then start the dev server and open the SyncList app on the phone:

```sh
npm start            # = expo start --dev-client
```

Your phone and PC must be on the same Wi-Fi. If they can't see each other, use `npm start -- --tunnel`.

You only need to rebuild the APK when native dependencies or `app.config.ts` plugins change. JS changes reload instantly.

## Scripts

| Command            | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| `npm start`        | Dev server for the dev build                             |
| `npm run check`    | Typecheck, lint and unit tests (run before every commit) |
| `npm test`         | Jest unit and component tests                            |
| `npm run test:rls` | pgTAP RLS tests against `SUPABASE_DB_URL` (rolled back)  |
| `npm run db:push`  | Apply new migrations to the linked project               |
| `npm run db:seed`  | Seed demo users, lists and tasks (dev only)              |
| `npm run format`   | Prettier                                                 |

## Project layout

```
app/                    Expo Router routes (screens are thin; logic lives in src/)
  (auth)/               sign-in, phone OTP
  (onboarding)/         profile setup, widget intro
  (app)/                lists home, settings
src/
  features/             auth, profile, onboarding, lists, settings, system
  lib/                  env (validated), supabase client, query client, DB types
  ui/                   theme tokens (light/dark) + small component kit
  db/                   Phase 2: SQLite schema, outbox, repositories
  sync/                 Phase 3: outbox worker, delta sync, realtime, conflict rules
native/                 Phase 4/5: Glance + WidgetKit widget sources (copied in by config plugins)
supabase/
  migrations/           numbered SQL migrations (the only way the schema changes)
  tests/                pgTAP RLS tests (+ _fixtures.sql)
  functions/            Edge Functions (Phase 3+)
scripts/                seed + SQL test runner
__tests__/              Jest tests (*-test.ts[x])
```

## Phase 1: what was built

**App**

- Expo SDK 58 dev-build project with TypeScript strict (plus `noUncheckedIndexedAccess`), ESLint (no `any`) and Prettier.
- EAS profiles: `development` (dev-client APK), `preview` (APK) and `production`.
- `app.config.ts` sets the package id `com.akshit.synclist` and the deep-link scheme `synclist://`.
- Env vars are checked at startup. If any are missing, a "Setup needed" screen lists them instead of crashing.
- The Supabase session is stored encrypted: the key is in the Android Keystore (SecureStore) and the ciphertext in AsyncStorage. Tokens refresh only while the app is in the foreground.
- Google sign-in uses a native ID token and `signInWithIdToken`. Phone OTP is built but switched off by the flag.
- Routing is declarative. A pure, unit-tested `resolveAuthRoute()` decides where you go: sign-in → profile setup (name and photo, cropped and resized to 512 px, then uploaded) → animated "add the widget" intro (once per device, honours reduce-motion) → Lists home.
- The Lists home shows an empty state. Settings has sign-out.
- Light and dark themes follow the system.

**Database** (`supabase/migrations/0001…0007`)

- Tables: `profiles`, `lists`, `list_members`, `invites`, `tasks`, `task_notes`. The v1.5 tables arrive in Phase 6.
- Every table has `updated_at`, `updated_by` and `deleted_at`. Clients never hard-delete; removing a member is a soft delete too, so the removal syncs.
- Triggers:
  - **Profile creation:** creates a profile on sign-up, prefilled from Google.
  - **Owner membership:** adds the creator as owner of a new list.
  - **Version counter:** a server-owned `version` that bumps on every write.
  - **Done fields:** keeps `done_by` and `done_at` consistent with `is_done`.
  - **Note list id:** fills `task_notes.list_id` from the task, for RLS and Realtime filters.
- **Limits:** 50 members per list, 2,000 open tasks per list and 20 invites per user per 24 hours. They raise custom SQLSTATEs (`SL413`, `SL429`, `SL403`) that the client can match on.
- **RLS on every table:**
  - Only members can read a list's data.
  - Viewers can't write.
  - Only owners can edit or delete a list, change roles, or manage invites.
  - Clients can't insert memberships; joining happens only through the Phase 3 Edge Function.
  - Grants are column-level. `push_tokens` is never readable or writable by clients, and `TRUNCATE` and `DELETE` are revoked.
- A public `avatars` bucket where each user can write only to their own folder.
- Realtime publication for `lists`, `list_members`, `tasks` and `task_notes`.

**Tests**

- Jest covers env parsing, the auth routing rules, the phone/OTP parsers, name validation and initials, the TAP parser, and the sign-in and Lists home screens.
- pgTAP RLS suites (85 assertions) cover read isolation, viewer and editor writes, owner powers and membership rules, and the limits.

**Assumptions to confirm**

- **Notes:** the 10,000-character limit applies to the note's visible text and is enforced in the app. The DB caps the serialised JSON at 50,000 bytes.
- **Invites:** only Owners can create invites.
- **Owners:** an Owner can't leave a list without transferring ownership first. Ownership transfer is a later server-side feature.
- **Additions to the brief's schema:**
  - `profiles.onboarded_at`, which drives onboarding.
  - `task_notes.list_id`, for RLS and Realtime filters.
  - `task_notes.version` and `created_at` on `tasks` and `task_notes`.
  - `notify_level` values: `all`, `assigned_to_me`, `my_tasks` and `none`.
