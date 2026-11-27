# SyncList

SyncList is a shared to-do app that lives on your phone's home screen as a widget. Lists sync in real time with everyone they're shared with, and every task can have its own notes.

- **Platform:** Android first. iOS follows after the Android launch.
- **Stack:** Expo SDK 58 (development build), React Native 0.88, TypeScript strict, Expo Router, Supabase (Postgres, Auth, Realtime, Storage).
- **Repository:** <https://github.com/AKSHIT0305/synclist>

> **New to the project?** Read [Current status](#current-status) first, then follow [Getting started](#getting-started) from top to bottom. [Working on the project](#working-on-the-project) covers the rules every change must follow.

---

## Contents

1. [Current status](#current-status)
2. [Getting started](#getting-started)
3. [Environment variables](#environment-variables)
4. [Supabase: database, migrations, RLS tests](#supabase-database-migrations-rls-tests)
5. [Google sign-in](#google-sign-in)
6. [Build and run on an Android phone](#build-and-run-on-an-android-phone)
7. [Architecture](#architecture)
8. [Working on the project](#working-on-the-project)
9. [Roadmap](#roadmap)
10. [Troubleshooting](#troubleshooting)
11. [Decisions and assumptions](#decisions-and-assumptions)

---

## Current status

| Phase | Scope                                                        | State                                    |
| ----- | ------------------------------------------------------------ | ---------------------------------------- |
| 1     | Foundation: app shell, schema + RLS, Google sign-in, profile | 🟡 code done, not yet tested on a device |
| 2     | Lists and tasks for a single user, offline-first (SQLite)    | ⏳ next                                  |
| 3     | Sync, sharing, invites, conflict handling                    | —                                        |
| 4     | Android home-screen widget (Jetpack Glance)                  | —                                        |
| 5     | iOS widget (WidgetKit)                                       | —                                        |
| 6     | v1.5 features (assignees, activity feed, …)                  | —                                        |

### Phase 1: what's done and what's left

Done and passing locally:

- [x] App code: sign-in, profile setup, widget intro, empty Lists home, settings with sign-out
- [x] Database migrations `0001`–`0007` (schema, triggers, limits, RLS, storage, realtime)
- [x] pgTAP RLS test suites (85 assertions) and a runner for them
- [x] `npm run check` (typecheck, lint, 33 Jest tests)

Still to do before Phase 1 counts as done. Each item has a section below.

- [ ] Get `SUPABASE_DB_URL` connecting (the last try failed with a wrong-password error; see [Troubleshooting](#troubleshooting))
- [ ] Apply the migrations to the hosted Supabase project: `npm run db:push`
- [ ] Run `npm run test:rls` against the hosted database and fix any failures
- [ ] Regenerate `src/lib/database.types.ts` from the live schema (it's hand-written for now)
- [ ] Create the Google OAuth clients and enable the Google provider in Supabase
- [ ] `eas init`, then build and install the development APK
- [ ] **Phase 1 check:** on an Android phone, sign in with Google → profile setup → widget intro → empty Lists home. Kill and reopen the app: you should still be signed in.

Phase 2 starts only after the Phase 1 check passes.

---

## Getting started

### Prerequisites

| Tool                 | Notes                                                                       |
| -------------------- | --------------------------------------------------------------------------- |
| **Node.js LTS**      | `winget install OpenJS.NodeJS.LTS` on Windows, or from <https://nodejs.org> |
| **Git**              |                                                                             |
| **An Android phone** | Allow "install unknown apps" for your browser or file manager               |
| **Expo account**     | For EAS cloud builds. You don't need Android Studio, a JDK or Docker.       |

### Access to ask the project owner for

The project uses a few shared hosted services. Ask the project owner for access to each:

| Service          | What you need                                                            | Why                                               |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| **GitHub**       | Collaborator access to `AKSHIT0305/synclist`                             | To push branches and open PRs                     |
| **Supabase**     | An invite to the SyncList project (or the values for your `.env`)        | Database, auth and storage                        |
| **Expo / EAS**   | Membership of the Expo account or organization that owns the project     | To build the APK with the shared `EAS_PROJECT_ID` |
| **Google Cloud** | Access to the OAuth clients, or have the owner add your keystore's SHA-1 | Google sign-in on your build                      |

> 🔒 Secrets (the Supabase secret / service-role key and the database password) must be shared through a private channel, **never** in the repo, an issue, a PR or a public chat.

### First-time setup

```sh
git clone https://github.com/AKSHIT0305/synclist.git
cd synclist
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Fill in `.env` (see [Environment variables](#environment-variables)), then check everything works:

```sh
npm run check               # typecheck + lint + unit tests — should be all green
```

If `.env` values are missing, the app doesn't crash. It opens a **"Setup needed"** screen that lists the missing variables.

---

## Environment variables

`.env` is git-ignored. `.env.example` is the committed template. **When you add a variable, add it to `.env.example` in the same commit.**

| Variable                           | Secret? | Where to get it                                                                 | Used by                    |
| ---------------------------------- | ------- | ------------------------------------------------------------------------------- | -------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`         | no      | Supabase → Project Settings → API → Project URL                                 | app                        |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`    | no      | Supabase → API keys → **publishable** key (`sb_publishable_…`)                  | app                        |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | no      | Google Cloud → Credentials → the **Web application** client ID                  | app                        |
| `EXPO_PUBLIC_ENABLE_PHONE_OTP`     | no      | Keep `false` until an SMS provider is set up                                    | app                        |
| `EAS_PROJECT_ID`                   | no      | Printed by `npx eas-cli@latest init`                                            | `app.config.ts`            |
| `GOOGLE_IOS_URL_SCHEME`            | no      | Reversed iOS client ID. Only needed once iOS work starts.                       | `app.config.ts`            |
| `SUPABASE_SERVICE_ROLE_KEY`        | **yes** | Supabase → API keys → **secret** key (`sb_secret_…`)                            | `scripts/seed.ts`          |
| `SUPABASE_DB_URL`                  | **yes** | Supabase → **Connect** → **Session pooler** URI, with the DB password filled in | `scripts/run-sql-tests.ts` |

Anything prefixed `EXPO_PUBLIC_` is bundled into the app and readable by anyone who has the APK. Never put a secret in an `EXPO_PUBLIC_` variable.

`SUPABASE_DB_URL` should look like this, with no brackets around the password:

```
postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres
```

---

## Supabase: database, migrations, RLS tests

**The schema is only ever changed through numbered SQL files in `supabase/migrations/`.** Never change tables, policies or functions by hand in the dashboard. Auth provider settings (like enabling Google) are dashboard configuration, not schema, so those are fine.

### Link the CLI and apply migrations

The Supabase CLI is a dev dependency, so `npx supabase` works without a global install.

```sh
npx supabase login                                  # opens a browser, one time
npx supabase link --project-ref <project-ref>       # the ref is the subdomain of the project URL
npx supabase db push --dry-run                      # review what would be applied
npm run db:push                                     # apply new migrations
```

### Run the RLS tests

```sh
npm run test:rls                 # all files in supabase/tests/
npm run test:rls -- 02_task      # only files whose name contains "02_task"
```

The runner (`scripts/run-sql-tests.ts`) connects with `SUPABASE_DB_URL`. It runs each test file inside `BEGIN … ROLLBACK` with its own fixtures (`supabase/tests/_fixtures.sql`), so **it leaves no data behind**, even against the hosted database. Inside a test you switch identity with `select pg_temp.login_as('<uuid>')`, `pg_temp.login_anon()` and `pg_temp.logout()`.

### Seed demo data (dev project only)

```sh
npm run db:seed                                  # demo users, two lists, tasks, a note
npm run db:seed -- --member you@gmail.com        # also add your account to the demo lists (sign in once first)
```

### Regenerate DB types after a schema change

```sh
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

---

## Google sign-in

The app uses native Google Sign-In (`@react-native-google-signin/google-signin`) to get an ID token. It then exchanges that token with `supabase.auth.signInWithIdToken`.

1. **Web client.** Google Cloud Console → APIs & Services → Credentials → **Create OAuth client → Web application**.
   - Put its client ID in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   - In Supabase → Authentication → Sign In / Providers → **Google**, enable the provider and paste in the client ID and secret.
2. **Android client.** Create an OAuth client of type **Android**:
   - Package name: `com.akshit.synclist`
   - SHA-1: the fingerprint of the keystore that signs your build. Get it with `npx eas-cli@latest credentials -p android` → _development_ → _Keystore_. The keystore is created on the first EAS build.
3. Each signing keystore needs its own Android client (or SHA-1 entry). That includes a second developer's build and the production build. Supabase doesn't need to change, because the Web client ID is the token audience.

> **Phone OTP** is fully built but hidden with `EXPO_PUBLIC_ENABLE_PHONE_OTP=false`. To turn it on, configure an SMS provider (Twilio or MSG91) in Supabase → Authentication → Phone, then set the flag to `true`.

---

## Build and run on an Android phone

The app uses native modules (Google Sign-In, SecureStore, SQLite), so it **does not run in Expo Go**. It runs in a **development build**, built in the cloud by EAS.

```sh
npx eas-cli@latest login
npx eas-cli@latest init          # first time only; put the printed id into EAS_PROJECT_ID
npx eas-cli@latest build --profile development --platform android
```

Open the build link or QR code on the phone and install the APK. Then start the dev server and open SyncList on the phone:

```sh
npm start                        # = expo start --dev-client
npm start -- --tunnel            # if the phone and PC aren't on the same Wi-Fi
```

JS and TS changes reload instantly. **You only need a new APK when native dependencies or `app.config.ts` plugins change.**

EAS profiles (`eas.json`):

| Profile       | Output                                  | Use                  |
| ------------- | --------------------------------------- | -------------------- |
| `development` | dev-client APK                          | Daily development    |
| `preview`     | standalone APK                          | Sharing a test build |
| `production`  | store build (auto-incrementing version) | Release              |

---

## Architecture

### Tech stack

| Concern             | Choice                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| App framework       | Expo SDK 58 dev build, React Native 0.88, React 19                                                        |
| Language            | TypeScript strict, plus `noUncheckedIndexedAccess`. No `any` (lint error).                                |
| Navigation          | Expo Router, with auth gating through `Stack.Protected`                                                   |
| Server state        | TanStack Query (`networkMode: offlineFirst`)                                                              |
| Client state        | Zustand                                                                                                   |
| Backend             | Supabase: Postgres with RLS, Auth, Realtime, Storage                                                      |
| Local DB (Phase 2+) | `expo-sqlite`, with an outbox for offline writes                                                          |
| Ordering (Phase 2+) | Fractional indexing (`tasks.position`, `text collate "C"`)                                                |
| Validation          | Zod v4                                                                                                    |
| Tests               | Jest 30 + jest-expo + React Native Testing Library 14; pgTAP for SQL. Maestro E2E is planned for Phase 3. |
| Widgets             | Kotlin + Jetpack Glance (Phase 4), SwiftUI WidgetKit (Phase 5)                                            |

### Project layout

```
app/                    Expo Router routes. Screens stay thin; logic lives in src/.
  _layout.tsx           Providers, env check, Stack.Protected route groups
  (auth)/               sign-in, phone (OTP, flagged off)
  (onboarding)/         profile setup, widget intro
  (app)/                lists home (index), settings
src/                    Non-route code, imported as "@/…"
  features/
    auth/               resolveAuthRoute (pure), authStore, Google sign-in, phone OTP, bootstrap hooks
    profile/            profile API, avatar picking and upload, name validation
    onboarding/         widget-intro screen and its "seen" flag
    lists/              Lists home screen (empty state for now)
    settings/           Settings screen (sign out)
    system/             config-error and profile-error screens
  lib/                  env (zod-validated), Supabase client, encrypted session storage, query client, DB types
  ui/                   theme tokens (light/dark) and a small component kit
  db/                   Phase 2: SQLite schema, outbox, repositories (placeholder)
  sync/                 Phase 3: outbox worker, delta sync, realtime, conflict rules (placeholder)
native/                 Phase 4/5: widget sources, copied in by config plugins (placeholder)
supabase/
  migrations/           numbered SQL migrations, the only way the schema changes
  tests/                pgTAP RLS tests and _fixtures.sql
  functions/            Edge Functions (Phase 3+)
scripts/                SQL test runner, TAP parser, seed script
__tests__/              Jest tests, named *-test.ts / *-test.tsx
```

> ⚠️ **Never create `src/app/`.** Expo Router gives `src/app` precedence over `app/`, so every route would silently disappear.

`android/` and `ios/` are **not** in the repo. They're generated at build time (Continuous Native Generation). Configure native behaviour in `app.config.ts` and config plugins, never by editing generated native folders.

### App flow

The pure function `resolveAuthRoute()` in `src/features/auth/resolveAuthRoute.ts` decides which route group is shown. It's unit tested, and the root layout feeds it into `Stack.Protected` guards.

```
not signed in ─────────────▶ (auth)/sign-in
signed in, no profile yet ─▶ (onboarding)/profile        name + photo (resized to 512 px, uploaded to the avatars bucket)
widget intro not seen ─────▶ (onboarding)/widget-intro   once per device, honours reduce-motion
otherwise ─────────────────▶ (app)/index                 Lists home
```

The session is stored encrypted. An AES key lives in SecureStore (the Android Keystore) and the ciphertext in AsyncStorage. Tokens refresh only while the app is in the foreground.

### Data model

Tables: `profiles`, `lists`, `list_members`, `invites`, `tasks`, `task_notes`.

- **Sync columns:** every table has `updated_at`, `updated_by` and `deleted_at`. `tasks` and `task_notes` also have a server-owned `version` that bumps on every write.
- **No hard deletes:** clients only soft-delete, by setting `deleted_at`. That includes removing a list member, so the removal syncs like any other change.
- **Triggers:**
  - A profile is created on sign-up, prefilled from the Google profile.
  - The creator of a list becomes its owner.
  - `done_by` and `done_at` are kept consistent with `is_done`.
  - `task_notes.list_id` is filled in from the task, for RLS and Realtime filters.
- **Limits** raise custom SQLSTATEs that the client can match on:

  | Limit                              | SQLSTATE |
  | ---------------------------------- | -------- |
  | 50 members per list                | `SL413`  |
  | 2,000 open tasks per list          | `SL413`  |
  | 20 invites per user per 24 h       | `SL429`  |
  | Forbidden ownership or role change | `SL403`  |

- **Realtime** is enabled on `lists`, `list_members`, `tasks` and `task_notes`.
- **Storage:** a public `avatars` bucket. Each user can write only to their own `<uid>/` folder.

### Security model (RLS)

| Rule    | Detail                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| Read    | Only members of a list can see the list, its members, tasks and notes.                                              |
| Viewer  | Read-only.                                                                                                          |
| Editor  | Can create and edit tasks and notes.                                                                                |
| Owner   | Everything, plus renaming or deleting the list, changing roles, managing invites and removing members.              |
| Joining | Clients can't insert `list_members` rows. Joining happens only through an Edge Function (Phase 3).                  |
| Grants  | Column-level. `profiles.push_tokens` is never readable or writable by clients, and `DELETE`/`TRUNCATE` are revoked. |

Policies use the `SECURITY DEFINER` helpers `list_role()`, `is_list_member()`, `can_edit_list()` and `shares_list_with()`, so they don't recurse.

---

## Working on the project

### Rules

Every change must follow these rules. They're also in `CLAUDE.md` and `AGENTS.md` for AI coding assistants.

1. **TypeScript strict, no `any`.**
2. **Business logic is pure and unit-tested.** That covers sync, conflict merge, ordering, the outbox and routing decisions. Pure functions go in `src/`, tests in `__tests__/`. Screens stay thin.
3. **Every database change is a new numbered migration:** `supabase/migrations/NNNN_short_name.sql`.
   - Never edit a migration that has already been applied. Add a new one.
   - Never change the database by hand.
4. **RLS changes need pgTAP coverage** in `supabase/tests/`, and `npm run test:rls` must pass.
5. **Secrets only in `.env`.** Keep `.env.example` up to date.
6. **Install packages with `npx expo install <pkg>`**, not `npm install <pkg>`. It picks versions compatible with SDK 58. Dev-only tools go in `devDependencies` (`npm install -D <pkg>`).
7. **Expo APIs change every SDK release.** Check the versioned docs at <https://docs.expo.dev/versions/v58.0.0/> rather than relying on memory or old blog posts.
8. **Work phase by phase.** Write a short plan for the phase, agree on it, then build it with tests. Update this README (status table and "what was built") at the end of each phase.

### Git workflow

- `main` should always build and pass `npm run check`.
- Do work on a branch and open a pull request into `main`:

  ```sh
  git checkout main && git pull
  git checkout -b feat/phase-2-sqlite
  # …commit…
  git push -u origin feat/phase-2-sqlite
  ```

  Branch prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `test/`.

- **Small, focused commits** in [Conventional Commits](https://www.conventionalcommits.org) style, matching the existing history:

  ```
  feat(db): add task_assignees table with RLS
  fix(auth): keep session when token refresh fails offline
  test(sync): conflict merge for concurrent title edits
  ```

- **Migration numbers:** pull `main` before adding a migration and take the next free number. If two branches both add `0008_…`, the one merged second renumbers its migration before merging. Apply migrations to the shared Supabase project (`npm run db:push`) only from up-to-date `main`.

### Before you push

```sh
npm run check          # typecheck + lint + unit tests (required)
npm run format         # Prettier (required)
npm run test:rls       # required if you touched supabase/
```

### Scripts

| Command                           | What it does                                           |
| --------------------------------- | ------------------------------------------------------ |
| `npm start`                       | Dev server for the development build                   |
| `npm run android`                 | Dev server, then open on a connected Android device    |
| `npm run check`                   | Typecheck, lint and Jest                               |
| `npm run typecheck`               | `tsc --noEmit`                                         |
| `npm run lint`                    | ESLint (Expo config + Prettier)                        |
| `npm test` / `npm run test:watch` | Jest unit and component tests                          |
| `npm run test:rls`                | pgTAP RLS tests against `SUPABASE_DB_URL`, rolled back |
| `npm run db:push`                 | Apply new migrations to the linked Supabase project    |
| `npm run db:seed`                 | Seed demo users, lists and tasks (dev only)            |
| `npm run format` / `format:check` | Prettier write / check                                 |

### Testing notes

- Jest tests live in `__tests__/` and must be named `*-test.ts` or `*-test.tsx`.
- In React Native Testing Library 14, `render` and `fireEvent` are **async**, so always `await` them.
- `jest.setup.ts` mocks AsyncStorage and SecureStore.
- The `@/` alias maps to `src/` in both TypeScript and Jest.

---

## Roadmap

**Phase 2: lists and tasks for one user, offline-first** (next)

- SQLite schema in `src/db/` mirroring the server tables, with an outbox table for pending writes.
- Create, rename and delete lists. Add, complete, reorder (fractional indexing), edit and delete tasks. Task notes.
- Works fully offline. The Lists home gets real data, and the create button becomes active.

**Phase 3: sync and sharing**

- Outbox worker, delta pull by `updated_at`, Realtime subscriptions and conflict rules (`version`-based).
- Invite links and a join Edge Function, member roles and a member management UI.
- Maestro E2E for add → sync → complete.

**Phase 4:** Android home-screen widget (Kotlin, Jetpack Glance), added through a config plugin.

**Phase 5:** iOS app and WidgetKit widget.

**Phase 6:** v1.5 features (assignees, activity feed and others).

---

## Troubleshooting

| Problem                                                    | Fix                                                                                                                                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `password authentication failed` (28P01) from `test:rls`   | The password in `SUPABASE_DB_URL` is wrong, or the reset wasn't saved. Reset it in Supabase → Project Settings → Database, **confirm** the reset, and paste the new password with no brackets. |
| `Invalid URL` or connection errors with a correct password | Special characters (`% @ : / # ?`) in the password must be URL-encoded. It's easier to reset to an alphanumeric password.                                                                      |
| App shows **"Setup needed"**                               | A required `EXPO_PUBLIC_*` value is missing from `.env`. Fill it in and restart `npm start` with `--clear`.                                                                                    |
| Google sign-in fails with `DEVELOPER_ERROR`                | The SHA-1 of the keystore that signed your APK isn't registered on an Android OAuth client, or the package name doesn't match `com.akshit.synclist`.                                           |
| App won't open in Expo Go                                  | That's expected. Use the development build ([Build and run](#build-and-run-on-an-android-phone)).                                                                                              |
| Native module not found after adding a package             | Packages with native code need a new development build.                                                                                                                                        |
| `npm run x -- --flag` drops the flag in PowerShell         | PowerShell can swallow `--`. Quote it: `npm run test:rls "--" 02_task`.                                                                                                                        |
| npm warns that install scripts were blocked                | npm 11 blocks dependency install scripts by default. Approved ones are listed under `allowScripts` in `package.json`. Only add a package there if it actually needs its script.                |
| All routes disappeared                                     | Check that nobody created `src/app/`.                                                                                                                                                          |

---

## Decisions and assumptions

**Decided**

- Google sign-in only for v1. Phone OTP is built but flagged off.
- Package ID `com.akshit.synclist`, deep-link scheme `synclist://`.
- Builds run on EAS cloud, and the backend is hosted Supabase. There's no local Docker stack.
- iOS work starts after the Android launch.

**Assumptions** (confirm or change)

- **Notes:** the 10,000-character limit applies to the visible text and is enforced in the app. The DB caps the serialised JSON at 50,000 bytes.
- **Invites:** only owners can create invites.
- **Owners:** an owner can't leave a list without first transferring ownership. Transfer is a later server-side feature.
- **Additions to the original schema:**
  - `profiles.onboarded_at`, which drives onboarding.
  - `task_notes.list_id`, for RLS and Realtime filters.
  - `task_notes.version`, and `created_at` on `tasks` and `task_notes`.
  - `notify_level` values: `all`, `assigned_to_me`, `my_tasks` and `none`.
