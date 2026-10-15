# Shared database setup and validation

The web app supports voting at `/p/[pollId]`. Poll creation, moderation, and
management belong to the Android app. The existing Supabase migrations and SQL
validation scripts are retained because they describe shared database behavior.
Removing the web creator pages does not change the deployed database.

## Migrations

For a fresh Supabase project, run the complete `supabase_schema.sql` snapshot, shared
with Android. It includes the deployed policies, grants, triggers, and RPCs. Do not
apply the historical migrations again after loading that snapshot.

For an existing production-shaped schema, the versioned updates are:

- `20261015090518_fix_option_insert_policy_and_client_privileges.sql`
- `20261015101848_templates_and_multi_choice.sql`
- `20261015104704_allow_complete_ballot_sets.sql`

The `202610140001` and `202610140002` files are historical creator-flow migrations,
retained for reference; they are already included in the full snapshot.

## Templates and ballots

`polls.voting_mode` defaults to `SINGLE`. Existing `votes` rows and their unique
poll/voter constraint remain intact. `MULTIPLE` polls use private `poll_ballots`
rows with a complete selected-option array per poll/voter. `cast_ballot` accepts
both modes; `cast_vote` remains available for legacy single-choice clients and
rejects multiple-choice polls. Both hold the parent poll lock before validating
or changing ballots and counters. Identical retries are no-ops, even for locked
votes; changed ballots respect `allow_vote_change`. `voter_count` counts people,
while option-count sums count selections. Percentages use voters; stacked bars
use selection share. Client roles cannot write either aggregate counter directly.

`poll_options.position` preserves draft order. New suggestions append after the
original options. `poll_templates` is owner-readable and RPC-written only.
`save_poll_template` takes a snapshot, links the source as round one, and updates
an existing template when the same source is saved again. Weekly schedules store
ISO weekday, local time, and an IANA timezone; Android resolves the next occurrence.
`create_poll_v2` adds voting mode, an absolute cutoff, and optional template lineage.
Ownership comes from `auth.uid()`; request UUID locking makes poll, options,
notification, and round allocation one idempotent transaction. Failed creation
rolls the allocation back. Creation request rows remain inaccessible to clients.

Release order: database migration first, compatible web client second, Android
last. The database migration is deployed; the web change is delivered for review.

`closed_at` is the scheduled cutoff while a poll is open and its closure time
when closed. The web voter calls `expire_poll` when loading an elapsed poll.
Database-time checks reject expired votes even without an active browser.
There is no background scheduler: a dormant elapsed poll can retain stored
status `OPEN` until accessed. Ties and zero-vote polls have no declared winner.
RPC row locks serialize voting, moderation, expiration, and closure.

The web app requires only the public Supabase key and a persisted authenticated
session, including anonymous sessions. No service-role key belongs in the client.
See the README for authentication and realtime configuration.

## Validation

Run `npm test`, `npm run lint`, and `npm run build` for the web app. On PowerShell
with restricted script execution, use `npm.cmd`.

Against an isolated disposable database with the baseline and migrations applied:

```sh
psql -X -v ON_ERROR_STOP=1 -f supabase/tests/creator_flow.sql
node supabase/tests/concurrency.mjs
```

The SQL suite exercises ownership, creation, moderation, voting, expiration,
closure, and legacy Android insert compatibility inside a rolled-back transaction.
The concurrency script requires `PICKLE_TEST_DATABASE_URL`,
`PICKLE_ISOLATED_DATABASE=1`, and `psql`, and accepts only a local database. It creates temporary
test users and polls and cleans them up. These backend checks are separate from
the web unit tests and require a configured database.

Run `supabase/tests/stability_rollback.sql` and
`supabase/tests/templates_ballots_rollback.sql` with stop-on-error enabled. Both
use authenticated identities and roll back all fixtures. The existing concurrency
harness requires an isolated local Postgres instance; never point it at production.

For browser smoke tests without database writes, run
`node scripts/browser-fixture-server.mjs`, set a temporary `.env.local` with URL
`http://127.0.0.1:55432` and any dummy public key, then start Next.js. Fixture poll
IDs end in `0001` (single) and `0002` (multiple). Remove those temporary environment
values before configuring a real deployment. The fixture server binds loopback
only and keeps ballots in memory.
