# Shared database setup and validation

The web app supports voting at `/p/[pollId]`. Poll creation, moderation, and
management are available on the web at `/app` and in Android. The existing Supabase migrations and SQL
validation scripts are retained because they describe shared database behavior.
Both clients use the same existing database functions; this creator update applies no schema migrations.

## Migrations

Review the deployed schema, policies, grants, and triggers against Android's
baseline schema before applying these migrations to an isolated database:

1. `supabase/migrations/202610140001_creator_creation.sql`
2. `supabase/migrations/202610140002_creator_lifecycle.sql`

These transactional migrations add atomic, idempotent `create_poll`, suggestion
moderation through `moderate_option`, and deadline finalization through
`expire_poll`. They preserve Android's direct poll and approved-option inserts
and the existing voting/closing RPC argument names and void return types.
Direct authenticated vote writes are revoked; clients use `cast_vote` so option,
count, vote-change, and deadline checks cannot be bypassed.

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
closure, and Android insert compatibility inside a rolled-back transaction.
The concurrency script requires `PICKLE_TEST_DATABASE_URL`,
`PICKLE_ISOLATED_DATABASE=1`, and `psql`, and accepts only a local database. It creates temporary
test users and polls and cleans them up. These backend checks are separate from
the web unit tests and require a configured database.

## Complete ballots: Android's October 15 contract

Read-only inspection on 15 October 2026 confirmed that the configured deployment has polls.voting_mode, polls.voter_count, poll_options.position, poll_ballots.option_ids, and cast_ballot(uuid, uuid[]). The ballot SELECT policy restricts rows to auth.uid(); the authenticated role can execute cast_ballot. Its body requires auth.uid() but does not reject anonymous authenticated sessions. Neither schema nor auth settings were changed.

The additional shared migrations live in the Android repository's supabase/migrations directory:

- 20261015101848_templates_and_multi_choice.sql adds complete ballots, voting modes, distinct voter totals, option positions, and templates.
- 20261015104704_allow_complete_ballot_sets.sql permits nonempty complete ballots across all approved options, including polls expanded beyond ten options through suggestions.

The older migrations retained in this web checkout are not a complete bootstrap of the current contract. Use the canonical Android schema and migration chain when preparing an isolated database; do not reapply migrations to production for this UI update.

The web reads only the current user's ballot and legacy vote and prefers the ballot when present. For single-choice polls cast_ballot delegates to the legacy voting path. For multiple-choice polls it atomically replaces option_ids, adjusts aggregates, and increments voter_count only for a first ballot. No direct client writes to vote totals are used.
