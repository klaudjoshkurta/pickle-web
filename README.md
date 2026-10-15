# Pickle web

The web app for **Pickle** group polls. Create and manage polls at `/app` or in the Android app, then share `https://pickle-web-iota.vercel.app/p/{pollId}`. Voters can vote, see results and suggest options in their browser without installing anything.

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- Supabase JS v2, talking directly to the existing project (no custom backend)
- English and Greek, auto-detected, with an EN/EL toggle

## Routes

| Path | What it shows |
| --- | --- |
| `/` | Landing page with web creator and Android app entry points |
| `/app` | Creator welcome, first-run guide, My polls, and recent settled polls |
| `/app/login`, `/app/signup` | Email/password authentication and four-step signup |
| `/app/new` | Editable blank, starter, or template draft |
| `/app/templates`, `/app/closed` | Personal templates, six starters, and closed poll history |
| `/app/notifications`, `/app/account` | Inbox, profile, statistics, and sign out |
| `/app/demo` | Read-only sample polls without creating a guest session |
| `/app/share?poll=<id>` | Created-poll share confirmation |
| `/p/:pollId` | The poll: vote, results, suggestions, share |
| `/blog` | Published articles, in English and Greek with English fallback |
| `/blog/:slug` | A published blog article |
| `/keystatic` | GitHub-authenticated content editor |

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the anon/publishable key
npm run dev                  # http://localhost:3000
```

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wywzsnegtykcdqfkvtsj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The project's publishable key (`sb_publishable_…`) or legacy anon key, from Supabase → Project Settings → API Keys |

Both values are public by design. Row Level Security protects the data. Never put the `service_role` key here.

Other scripts: `npm run build`, `npm start`, `npm run lint` and `npm test` (unit tests for the poll logic).

## Blog editing

Keystatic manages blog content in GitHub. See [editor setup and publishing](docs/keystatic.md)
for GitHub App authorization, environment variables, translations, and the draft workflow.
Start local editor setup at `http://127.0.0.1:3000/keystatic`. Published content
appears after its GitHub changes reach the deployment branch and deploy successfully.

## Supabase prerequisites

The schema already exists. The retained migrations and SQL validation scripts are described in [shared database setup and validation](docs/database.md); migrations are provided but not applied automatically. The project needs:

1. **Anonymous sign-ins enabled** (Authentication → Sign In / Providers). Voters get a silent anonymous session on first visit, because every RLS policy requires `authenticated`.
2. **Email provider enabled**, for the optional "Sign in with email".
3. **Realtime publication** for live updates. Today the `supabase_realtime` publication has no tables, so the app falls back to polling every 10 seconds. To get instant updates, run once:
   ```sql
   alter publication supabase_realtime add table public.polls, public.poll_options;
   ```
   The app keeps polling until it receives its first realtime event, and starts polling again whenever the channel drops, so it works either way.
4. Add the deployed domain and public poll URLs (`/p/*`) to Authentication → URL Configuration (Site URL / Redirect URLs) if you use email confirmation links. Confirmation returns to the current poll, or the homepage outside a poll.
5. Enable manual identity linking and email verification for guest-account upgrades. After verifying their email, voters return to the poll and reopen email authentication from the profile dialog to finish setting a password. Signing into another account does not transfer guest votes or suggestions.

## Deploy

Next serves `/p/[pollId]` itself, so a refresh on a poll URL works without the SPA rewrite a static Vite build would need.

### Vercel
1. Import the repo. The Next.js framework preset is detected automatically.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Settings → Environment Variables (Production and Preview).
3. Deploy. The app currently runs at `https://pickle-web-iota.vercel.app`; to move to a custom domain, add it under Settings → Domains and update `SHARE_BASE`.

### Netlify
1. Import the repo. Netlify detects Next.js and uses its Next.js runtime (build command `npm run build`; leave the publish directory to the runtime).
2. Add the same two environment variables under Site configuration → Environment variables.
3. Deploy, and attach a custom domain if you have one (then update `SHARE_BASE`).

No `_redirects` or `vercel.json` rewrite is needed on either platform.

## How it works

- **Auth** ([src/lib/auth/AuthContext.tsx](src/lib/auth/AuthContext.tsx)): restores the persisted session (localStorage) or calls `signInAnonymously()`. Before the first vote or suggestion it asks for a display name and a DiceBear avatar, stored with `updateUser({ data: { display_name, avatar_url } })`.
- **Data** ([src/lib/pollApi.ts](src/lib/pollApi.ts)): loads the poll, its ordered options, the user's complete ballot, and their legacy single vote in parallel. Votes go through the `cast_ballot` RPC, and its exceptions map to friendly messages.
- **Live updates** ([src/lib/usePoll.ts](src/lib/usePoll.ts)): a Supabase Realtime channel on `polls` and `poll_options` for this poll, with 10s polling as a fallback and a refresh when the tab becomes visible again.
- **Visibility rules** ([src/lib/pollLogic.ts](src/lib/pollLogic.ts)): approved options for everyone, plus the voter's own pending suggestions. Results are hidden until the voter votes unless `show_results_before_voting` is set or the poll is closed.
- **Strings**: all copy is in [src/lib/i18n/translations.ts](src/lib/i18n/translations.ts).

## Design

- **Marketing palette:** cream paper (`#FAF2E3`), dark-brown ink outlines (`#3A2417`), tomato (`#E0532B`), mustard (`#F3C24F`), and deep teal (`#007564`) for actions and bars. The tokens live in `@theme` in [src/app/globals.css](src/app/globals.css).
- **Type:** marketing retains Google Sans. Poll pages use Rubik with Google Sans for Greek glyphs, heavy headings, and Android’s mustard offset shadow. Both fonts are bundled locally under `public/fonts` with their OFL licenses.
- **Results layout:** the top option gets a tomato "In the lead" / "Winner" card with per-vote segments. The others sit in an outlined list with teal bars. The landing page reuses these same components with demo data.
- **Contrast:** white text on tomato is used only for large or bold text. Smaller labels sit on the deeper tomato pill so they meet WCAG AA.
- **Motion:** bars and segments animate in, and the live dot pulses. All of it turns off under `prefers-reduced-motion`.

## Placeholders to replace

- `PLAY_STORE_URL` in [src/lib/config.ts](src/lib/config.ts) (Play Store listing).
- `SHARE_BASE` in the same file, if the public domain changes.

## Android voter parity — 15 October 2026

Public poll pages follow the current Android implementation and its handoff README. The older design boards are supporting references, not a feature checklist. See [validation and captures](docs/voter-parity.md).

- Compact checkmark/Pickle header, Android light/dark tokens, Rubik type, individual option cards, a submitted-vote banner, and phone bottom actions. Theme changes follow the OS; marketing layouts retain their own styling.
- Single-choice radios and multiple-choice checkboxes restore complete saved selections. Empty or unchanged ballots cannot be submitted; Keep my vote cancels changes.
- Reads the current user's poll_ballots with explicit voter filtering, giving them precedence over legacy votes. All submissions replace the complete set through cast_ballot(p_poll_id, p_option_ids). Approved choices sort by position, timestamp, then ID.
- Results use voter_count as the denominator, falling back to approved selection totals only for legacy records without a voter count. Multiple-choice percentages may total above 100%; voters and selections are labeled separately. Percentages truncate like Android, and result bars use the same denominator.
- Equal highest counts stay tied, including on older rows carrying a winner field. Closed zero-vote polls show an explicit empty result. Expired deadlines disable voting immediately while expire_poll finalizes server state.
- Identity uses ten Notionists avatar choices. New identities require an explicit face selection; shuffling clears it. Existing names and avatars are preserved. Forms use bottom sheets on phones and modal dialogs on desktop.
- A successful write followed by a failed refresh shows a Saved message and Refresh action. Refresh never repeats the write. Account changes clear in-progress selections.

Intentional web differences: link recipients can vote through persisted anonymous sessions, with optional email authentication; Android requires an account. Web keeps realtime updates with polling fallback and Web Share with clipboard fallback. Creator features are now also available on the web; see [creator implementation and validation](docs/creator-parity.md). Reopening, sudden death, result replays, backer lists, and image-card downloads are not implemented by this update.

No production data mutations or schema changes are needed for this client update. The target deployment's ballot contract was checked read-only; see [shared database notes](docs/database.md).

## Web creator features

Open `/app` for the creator experience: email signup/login, first-run guidance, owned polls, closed history, editable poll creation, six starters, personal templates, notifications, profile, and sign out. Poll owners also receive moderation, End voting confirmation, and Save as template controls on shared poll pages. Anonymous link voting remains supported.

See [creator parity and validation](docs/creator-parity.md) for the shared data contracts, draft/retry behavior, screenshots, isolated browser harness, and deployment auth-return configuration. Validation passed: 44 unit/API tests, lint, production build, and both creator/public-voter browser suites. No production deployment or data mutation was performed during validation.
