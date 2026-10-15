# Android voter parity

The October 15, 2026 Android README, theme tokens, poll screen, and result calculation define the baseline. The supplied design boards show additional concepts that are deliberately excluded. No Android files were changed.

## Acceptance evidence

- 29 unit/API tests cover visibility, deadlines, stable ordering, complete ballot precedence, explicit account filtering, single/multiple replacement contracts, backend error propagation, suggestion approval, ties, and distinct voter denominators.
- Production build and lint are required after changes. Fonts are hosted locally, including a Greek fallback, so the build does not require Google Fonts downloads.
- The isolated browser harness covers profile cancellation, required avatar selection, shuffle, submission, Keep my vote, complete replacement/reload, pending suggestions, locked votes, expiration, closed zero-vote results, ties, successful-write/failed-refresh recovery, and account switching.
- It checks 320, 390, 768, and 1280px layouts in both OS themes and English/Greek, plus 150% text at 320px. It checks horizontal overflow and that the phone action bar leaves the final content reachable. Reduced-motion mode is used for deterministic captures.
- Landing and blog routes are checked for rendering and absence of poll theming.

All browser users, avatars, ballots, counts, and suggestions are fixture data. HTTP requests to Supabase are intercepted; WebSocket connections are closed. Avatar images use a local fixture response, while production requests the Android Notionists URL. No real ballots are submitted.

## Running the browser harness

Use a Node environment with `playwright` installed and Microsoft Edge available. In Codex the bundled Playwright package can be exposed through `NODE_PATH`; it is not a production dependency.

```powershell
npm.cmd run build
npm.cmd start -- --port 3101 --hostname 127.0.0.1
```

In another terminal:

```powershell
$env:PICKLE_TEST_ORIGIN = 'http://127.0.0.1:3101'
node scripts/poll-parity-browser.cjs
```

The origin must be localhost or 127.0.0.1. Set `PICKLE_BROWSER_CHANNEL=chrome` to use an installed Chrome instead of Edge. The harness writes captures into `docs/screenshots`.

## Representative captures

- [Phone results, light](screenshots/poll-390-light-en.png)
- [Narrow results, dark, Greek](screenshots/poll-320-dark-el.png)
- [Identity sheet](screenshots/poll-identity-sheet.png)
- [Multiple-choice selection](screenshots/poll-multiple-vote.png)
- [Voting with enlarged text](screenshots/poll-vote-large-text.png)
- [Closed tie](screenshots/poll-closed-tie.png)
- [Desktop results](screenshots/poll-1280-light-en.png)

## Intentional differences and limits

Web voting remains account-free through Supabase anonymous authentication, with optional email login. Realtime/polling and browser share/copy are retained web adaptations. Creating/managing polls, templates, and notifications remain Android features. Closed results show immediately, without replay, reopening, sudden death, backer lists, or downloadable cards.

The production schema, grants, and ballot function were inspected read-only. Fixture checks do not replace a final cross-client smoke test with a dedicated test account and disposable poll. No production deployment, live vote, or database migration was performed.

Warm Windows Turbopack builds repeatedly panicked while starting CSS workers during validation. Clearing only generated Next.js caches restored builds. The missing Windows Rolldown binding was installed locally without changing the dependency manifests or lockfile.
