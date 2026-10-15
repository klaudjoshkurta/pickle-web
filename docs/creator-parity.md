# Web creator experience

Creator features now live under `/app`, using the same Supabase accounts, poll IDs, ballots, templates, and RPCs as Android. Public `/p/<id>` voting remains available without an email account.

## Delivered flows

- `/app`: welcome and read-only demo entry for visitors; first-run guide for a successfully loaded empty account; owned live polls and three recent settled polls for returning creators.
- `/app/login` and `/app/signup`: email/password login, four signup steps (name, avatar, email, password), explicit avatar selection, confirmation-email handling, anonymous-account upgrade completion, and sign out. Passwords stay in memory. Signing into another account does not transfer guest votes.
- `/app/new`: blank drafts, all six starters, and personal-template reuse. Questions, options, accessible reordering, voting mode, deadline, suggestion approval, result visibility, vote changes, and expected voters remain editable before creation.
- Drafts use account/source-specific session storage. Reloads restore option keys, ordering, settings, and request IDs. Retrying an unchanged draft reuses its request ID through `create_poll_v2`; editing generates a new request ID. Creation navigates directly to a share confirmation.
- `/p/<id>`: matching account owners can approve/reject pending suggestions, confirm End voting, and save/update a personal template. Confirmation shows the current tally. Closing immediately disables local voting, including when the following refresh fails. Refresh does not repeat committed operations.
- `/app/templates`: personal templates first, then six starters. Reuse selects the latest completed round, retains approved suggestions and option order, identifies runners-up/new choices, and initially excludes a unique prior winner when at least two alternatives remain. Weekly deadlines use the stored IANA timezone, including daylight-saving gaps and overlaps. Schedules seed drafts; they never auto-publish.
- `/app/closed`, `/app/notifications`, `/app/account`: closed history, inbox/read state, unread count, shared profile identity, owned-poll statistics, share Pickle, and sign out.
- `/app/demo`: static, read-only sample polls. Demo browsing does not sign in anonymously or load real poll data.

Creator screens use the existing scoped Android theme, system dark mode, Rubik with Greek fallback, and responsive layouts. The marketing header and hero now provide an Open Pickle / New poll entry point.

## Data boundaries

The browser filters owned polls by `creator_id`, private templates by `owner_id`, and activity by `user_id`. State and drafts are isolated by account; late responses cannot replace another account's data. Creator writes verify the current non-anonymous account before calling existing owner-authorized backend operations. Database authorization remains authoritative.

Read-only inspection confirmed the deployed RPC signatures, template/notification columns, and policies before implementation. No schema or authentication settings were changed. Poll creation already records its own activity atomically; the web does not insert a second creation notification. Moderation and closing follow Android's existing client-recorded activity behavior. The inbox does not imply push delivery or automatic cross-user notifications that the current backend does not implement.

Before deployment, allow the deployed `/app/signup` return URL in Supabase Auth's redirect configuration. Confirmation requirements and anonymous identity linking remain controlled by that deployment. Real email delivery and a final Android/web smoke test require a dedicated test account and disposable poll; fixture tests do not claim those checks.

## Validation

- 44 unit/API tests cover the existing voter/blog behavior plus creator account guards, creation payloads and retry IDs, input validation, six starters, template history, option exclusion, weekly schedules, daylight-saving gaps/overlaps, lifecycle RPC arguments, and notification ownership.
- `npm.cmd run lint` and `npm.cmd run build` validate the complete web project.
- `scripts/creator-browser.cjs` exercises signup, anonymous upgrade, login/logout, demo isolation, draft restoration/order, creation-response loss and retry, multi-choice settings, moderation, template save/reuse, closing confirmation and refresh recovery, notifications, and profile updates. All remote requests are intercepted. It also captures 320, 390, 768, and 1280px layouts in English/Greek and light/dark mode, plus enlarged text.
- The existing `scripts/poll-parity-browser.cjs` remains the public-voter regression suite.

Run either browser script against a local production preview with Playwright available on Node's module path:

```powershell
npm.cmd run build
npm.cmd start -- --hostname 127.0.0.1 --port 3101
```

In another terminal:

```powershell
$env:PICKLE_TEST_ORIGIN = 'http://127.0.0.1:3101'
node scripts/creator-browser.cjs
node scripts/poll-parity-browser.cjs
```

The default browser is installed Edge; set `PICKLE_BROWSER_CHANNEL=chrome` for Chrome. Captures use fixture identities and avatar images. No real accounts, ballots, polls, or notifications are created by these scripts.

Representative captures: [first run](screenshots/creator-first-run.png), [draft](screenshots/creator-film-draft.png), [share confirmation](screenshots/creator-share.png), [template round](screenshots/creator-template-round.png), and [dashboard](screenshots/creator-dashboard.png).
