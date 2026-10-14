# Creator flow setup and validation

The web app now supports `/create`, `/dashboard`, and `/manage/[pollId]`.
The create form follows the supplied Android source: multiline question,
2–10 option fields with a distinct-option count, deadline pills, descriptive
voting switches, conditional approval settings, and a persistent creation action.
Expected-voter input keeps four digits; blank or zero is persisted as unknown.
The atomic creation migration also records Android's `POLL_CREATED` notification
once per successful creation, including when creation is retried.
Public links remain `pollShareUrl(id)` → the existing `/p/{id}` domain.
All data access uses the persisted Supabase browser session and public key.
No service-role credential is needed in the web app.

## Database prerequisites

The baseline inspected was Android's supplied `supabase_schema.sql`, including
`polls`, `poll_options`, `votes`, their policies, `cast_vote(uuid,uuid)`, and
`close_poll(uuid)`. The deployed database and auth configuration were **not**
verified. Before applying anything, compare deployed policies, grants, triggers,
and function definitions with that baseline. Extra permissive policies must not
undo the permission checks in these migrations.

Review and apply to an isolated Supabase clone, in this order:

1. `supabase/migrations/202610140001_creator_creation.sql`
2. `supabase/migrations/202610140002_creator_lifecycle.sql`

Neither migration was applied to production. Both are transactional. They add
`create_poll`, `moderate_option`, and `expire_poll`, and preserve the argument
names and void return types of the existing voting/closing RPCs. Android's
direct creator poll/option inserts remain supported. Direct authenticated writes
to `votes` are revoked because they bypass count, option, and deadline validation;
the inspected Android implementation and web voter both use `cast_vote`.

Creation is atomic and deduplicated by `(auth.uid(), request_id)`. Request records
are inaccessible to browser roles. A retry returns the original poll even if the
response was lost. Forms retain the submitted payload/key across refresh until
the outcome is confirmed; only definitive database errors unlock editing.
Drafts are scoped to the session's user ID and contain no credentials or profile
data. Browser storage failures are surfaced, and requests cannot promise retry
deduplication across refresh if browser storage is unavailable.

`closed_at` is the scheduled cutoff while `OPEN`, and closure time while `CLOSED`.
Expired votes are rejected using database time, even without an active browser.
`expire_poll` closes elapsed polls on dashboard/public/management access and on
web deadline timers; it preserves the scheduled cutoff. There is no background
scheduler, so a dormant expired poll can still have stored status `OPEN` until
accessed. Manual early closure records database time. Winner selection excludes
pending/rejected options; ties and zero votes have a null winner.

Row locks serialize RPC voting, moderation, expiry, and closing. A trigger also
guards Android's direct option insert/status updates. Creation RPCs use a fixed
empty search path and qualified relations. RPC execution is restricted to
authenticated sessions; anonymous sign-ins use that same database role.

Reopening has no supported RPC in the supplied contract and is absent from the
web UI. Templates, sudden death, sample polls, and exported share cards are out
of scope. The original schema exposes option counts to authenticated readers;
the existing voter UI's pre-vote results visibility remains a presentation rule.

## Authentication configuration

- Enable anonymous sign-ins and the email provider.
- Enable manual identity linking for preserving guest polls during registration.
- Enable email verification. Guest registration calls `updateUser({email})`,
  then sets a password only after the email is verified, preserving the user ID.
- Add deployed and local `/dashboard` URLs to allowed auth redirect URLs and set
  the correct Site URL. Keep the default email-change confirmation behavior.
- Return to “Sign in or save your guest account” after verification to finish
  password setup. The pending setup marker survives refresh in user metadata;
  passwords are never saved in a draft.
- Signing into an existing account switches identities and does not transfer
  guest polls. No ownership-transfer operation is introduced.

See [Supabase's anonymous identity upgrade documentation](https://supabase.com/docs/guides/auth/auth-anonymous).
If anonymous sign-in fails, the creator shell still offers email authentication.
Session loss clears creator data and stops live subscriptions rather than
silently replacing an existing creator identity with a new guest.

Realtime on `polls` and `poll_options` is optional. Until an actual event arrives,
the app polls every ten seconds and refreshes when the tab becomes visible.
Deadline timers run independently of realtime. Failed background reads retain
the last results with a visible retry notice.

## Validation

Run `npm run lint`, `npx tsc --noEmit`, `npm test`, and `npm run build`.
On PowerShell with restricted script execution, use `npm.cmd`/`npx.cmd`.
Unit/API tests verify normalization, expected-voter limits, draft corruption and
recovery, deadline boundaries, session-derived RPC payloads, missing/non-owner
management, expiry refresh, errors, and existing result/voter logic. Mocked API
tests do not prove RLS or transactional correctness.

Against an **isolated** Supabase database with both migrations applied, run:

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/creator_flow.sql
```

The SQL suite impersonates authenticated users, tests forged ownership,
non-owner mutations, injected option-insert rollback, creation retries,
moderation, voting/change limits, winner/tie/no-vote closure, scheduled deadlines,
and Android-shaped inserts. Everything rolls back. Do not run it in production.

For concurrent creation, voting/closing, and moderation/closing checks, set
`PICKLE_TEST_DATABASE_URL` to an isolated local Supabase connection URL and
`PICKLE_ISOLATED_DATABASE=1`, then run `node supabase/tests/concurrency.mjs`.
The runner requires `psql` (or `PSQL_BIN`), rejects remote hosts, uses separate
connections, and removes its generated fixtures afterward. It applies no
migrations. It checks that simultaneous creation retries return one poll ID,
counts match committed votes after closure, and options cannot change afterward.
These concurrency checks have not been executed in the current environment.

Two-browser acceptance checklist (after configuring a test project):

1. Guest creator creates a poll with settings/deadline; refresh management and
   dashboard and confirm ownership and the expected public URL.
2. A second independent session votes, changes its vote, and suggests an option.
   Verify live counts and moderation without reloading; reject/approve suggestions.
3. Creator closes the poll. Check the public page and dashboard after refresh,
   including single winner, tie, and no votes. Late votes must fail.
4. Verify deadline expiration while visible, backgrounded, and with realtime
   unavailable. Future deadlines must display as open.
5. Upgrade the guest through verified email and password setup; confirm the user
   ID and dashboard polls are unchanged after refresh and account sign-in.
6. Check missing/unauthorized routes, lost sessions, offline retries, unavailable
   storage, double submission, native-share cancellation, and clipboard failure.
7. Check 320px mobile and desktop layouts, long questions/options, English/Greek,
   keyboard and dialog focus, field/error labels, and reduced motion.

Database and two-browser validation require tooling and a configured isolated
backend; neither is available in this environment. They remain handoff checks.
