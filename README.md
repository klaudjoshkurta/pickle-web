# Pickle web

The web app for **Pickle** group polls. Creators can make and manage polls on the web or Android and share `https://pickle-web-iota.vercel.app/p/{pollId}`. Voters can vote, see results and suggest options without installing anything.

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- Supabase JS v2, talking directly to the existing project (no custom backend)
- English and Greek, auto-detected, with an EN/EL toggle

## Routes

| Path | What it shows |
| --- | --- |
| `/` | Landing page with a "Get the Android app" call to action |
| `/p/:pollId` | The poll: vote, results, suggestions, share |
| `/create` | Create a real poll as a guest or account holder |
| `/dashboard` | Current creator's open and closed polls |
| `/manage/:pollId` | Owner results, suggestions, sharing, and closing |

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

## Supabase prerequisites

The schema already exists. Creator functionality needs the additive migrations described in [creator setup and validation](docs/creator-flow.md); migrations are provided but not applied automatically. The project needs:

1. **Anonymous sign-ins enabled** (Authentication → Sign In / Providers). Voters get a silent anonymous session on first visit, because every RLS policy requires `authenticated`.
2. **Email provider enabled**, for the optional "Sign in with email".
3. **Realtime publication** for live updates. Today the `supabase_realtime` publication has no tables, so the app falls back to polling every 10 seconds. To get instant updates, run once:
   ```sql
   alter publication supabase_realtime add table public.polls, public.poll_options;
   ```
   The app keeps polling until it receives its first realtime event, and starts polling again whenever the channel drops, so it works either way.
4. Add the deployed domain to Authentication → URL Configuration (Site URL / Redirect URLs) if you use email confirmation links.

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
- **Data** ([src/lib/pollApi.ts](src/lib/pollApi.ts)): loads the poll, its options (by `created_at`) and the user's own vote in parallel. Votes go through the `cast_vote` RPC, and its exceptions map to friendly messages.
- **Live updates** ([src/lib/usePoll.ts](src/lib/usePoll.ts)): a Supabase Realtime channel on `polls` and `poll_options` for this poll, with 10s polling as a fallback and a refresh when the tab becomes visible again.
- **Visibility rules** ([src/lib/pollLogic.ts](src/lib/pollLogic.ts)): approved options for everyone, plus the voter's own pending suggestions. Results are hidden until the voter votes unless `show_results_before_voting` is set or the poll is closed.
- **Strings**: all copy is in [src/lib/i18n/translations.ts](src/lib/i18n/translations.ts).

## Design

- **Palette:** cream paper (`#FAF2E3`), dark-brown ink outlines (`#3A2417`), tomato (`#E0532B`), mustard (`#F3C24F`), and deep teal (`#007564`) for actions and bars. The tokens live in `@theme` in [src/app/globals.css](src/app/globals.css).
- **Type:** chunky Fredoka headings with a mustard offset shadow (the `headline-pop` utility). Greek headings fall back to M PLUS Rounded 1c, and body text is Google Sans.
- **Results layout:** the top option gets a tomato "In the lead" / "Winner" card with per-vote segments. The others sit in an outlined list with teal bars. The landing page reuses these same components with demo data.
- **Contrast:** white text on tomato is used only for large or bold text. Smaller labels sit on the deeper tomato pill so they meet WCAG AA.
- **Motion:** bars and segments animate in, and the live dot pulses. All of it turns off under `prefers-reduced-motion`.

## Placeholders to replace

- `PLAY_STORE_URL` in [src/lib/config.ts](src/lib/config.ts) (Play Store listing).
- `SHARE_BASE` in the same file, if the public domain changes.
