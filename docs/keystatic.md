# Keystatic blog

The content editor is at `/keystatic`; public pages are `/blog` and
`/blog/[slug]`. Content is stored in `georgeshkurta13/pickle-web` on GitHub.
Editors authenticate with a GitHub App and need repository write access.
Pickle poll accounts are independent of editor authentication.

## Connect the GitHub App

1. Run `npm install`, then `npm run dev`.
2. Open **http://127.0.0.1:3000/keystatic**. Use this loopback address
   consistently; Keystatic redirects `localhost` for GitHub OAuth. Next's
   `allowedDevOrigins` includes `127.0.0.1` to permit development assets.
3. Choose GitHub sign-in and follow Keystatic's setup wizard to create a
   GitHub App. Enter your production site URL when prompted. Install the App
   on **only `georgeshkurta13/pickle-web`** and authorize access.
4. The wizard writes credentials into an ignored `.env` file. Move those
   values into `.env.local` alongside the existing Supabase variables if
   needed. Remove duplicate values from `.env` to avoid ambiguity:

   | Variable | Purpose |
   | --- | --- |
   | `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub App OAuth client ID |
   | `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub App OAuth client secret; server-only |
   | `KEYSTATIC_SECRET` | Session encryption secret, at least 32 characters; server-only |
   | `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | App slug, visible to the browser |

5. In GitHub → Settings → Developer settings → GitHub Apps → your App,
   verify these callback URLs (replace the production origin if using a
   custom domain):
   - `http://127.0.0.1:3000/api/keystatic/github/oauth/callback`
   - `https://pickle-web-iota.vercel.app/api/keystatic/github/oauth/callback`
6. Add the same four variables to the hosting provider's environment
   settings for each environment that should support editing, then rebuild
   and deploy. The public App slug is embedded at build time. Use a stable
   preview URL with its own callback entry if editing on previews is needed.
7. Visit the deployed `/keystatic`, sign in with GitHub, and confirm you can
   create and save a draft on a content branch. Check the resulting commit
   in GitHub. Never paste credentials into tracked files or commit `.env`.

The setup wizard and account authorization require the repository owner's
GitHub access. Until those steps are complete, the public blog works with
the checked-out content, but hosted editing is not yet connected.

## Write and publish

- Create a post with an English title, shared URL slug, publication date,
  English summary, and English body. Slugs use lowercase ASCII letters,
  numbers, and single hyphens. Keep published slugs stable to preserve links.
- New posts have **Draft** checked. Draft posts are excluded from public
  listings, article routes, metadata, and public React payloads.
- Greek title, summary, and body are optional. The site uses the complete
  Greek article only when all three are nonempty. Otherwise Greek readers
  see the entire English article, marked `lang="en"`. The existing EN/EL
  toggle switches content without changing the URL.
- Fill the English body before unchecking Draft. A published article with
  incomplete English content fails validation when read, including during
  a production build; it is not silently published as an empty article.
- The date controls display and ordering only. A future date does not
  schedule publication. Posts sort newest first, with slug order for ties.
- Use the editor's GitHub branch selector for a content branch. Saving
  commits the content to that branch. Merge it into the hosting provider's
  deployment branch and wait for a successful deployment to publish.
- Saving does not immediately update an existing deployment. Public pages
  read the deployment's local Git checkout, not GitHub's live API. There is
  no public draft-preview feature or scheduled publishing.

## Files and rendering

`keystatic.config.ts` defines the schema. Each post stores metadata in
`src/content/posts/<slug>.json` and Markdoc bodies under
`src/content/posts/<slug>/en/body.mdoc` and `el/body.mdoc`.
Uploaded body images go under `public/images/blog` and are committed with
the article. Keystatic creates these files; no sample article ships.

The server validates and renders Markdoc. The client receives only
published summaries and rendered language variants, with no reader or
filesystem code. English supplies the initial page and SEO metadata.
Cache Components cache content within each deployment; a new build
invalidates the cache. File tracing explicitly includes the content for
Node.js hosting.

Article routes use `ensureStatic = 'navigation'` so unknown and draft slugs
resolve before headers are sent and return HTTP 404. For an empty collection,
the build validates an invalid placeholder slug that always returns 404;
no article is created or listed.

The public site and editor have independent root layouts. The editor
does not load Pickle's global CSS, Supabase/locale providers, or footer.
A global 404 preserves the public site's layout for unmatched URLs.

## Validation

Run `npm run lint`, `npm test`, `npx next typegen`, `npx tsc --noEmit`, and
`npm run build`. Tests use temporary content roots and do not publish posts.
Check `/blog` with no articles, a published English article, a complete
bilingual article, and a partially translated article. Verify drafts and
unknown slugs return 404, test EN/EL switching, and check mobile layout.
Also check `/`, `/p/<pollId>`, and `/keystatic` in development and with
`npm start` after a build. Test authenticated GitHub saves only after the
App and deployment variables are configured.

References: [Next.js integration](https://keystatic.com/docs/installation-next-js),
[GitHub mode](https://keystatic.com/docs/github-mode).
