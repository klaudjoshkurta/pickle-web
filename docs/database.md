# Shared database setup and validation

The web app supports voting at `/p/[pollId]`. Poll creation, moderation, and
management belong to the Android app. The existing Supabase migrations and SQL
validation scripts are retained because they describe shared database behavior.
Removing the web creator pages does not change the deployed database.

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
