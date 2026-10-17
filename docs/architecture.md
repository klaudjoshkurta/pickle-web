# Project structure

All application components live under `src/components`. Routes follow their URLs;
there are no separate marketing and product route groups.

```text
src/
  app/
    (site)/
      layout.tsx       Shared document, fonts, metadata, and providers
      page.tsx         Homepage
      blog/            Blog listing, articles, and footer layout
      p/               Public polls and poll theme layout
      not-found.tsx    Shared site error page
    (admin)/           Isolated Keystatic document and editor routes
    api/keystatic/     CMS route handler
    global-not-found.tsx
    globals.css
  components/
    layout/            Header, site footer, poll footer, and app promotion
    home/              Landing page sections and preview
    polls/             Voting, results, suggestions, and sharing
    blog/              Blog listing and article presentation
    auth/              Profile and email sign-in dialogs
    providers/         App providers, authentication, and locale context
    admin/             Keystatic editor component
    ui/                Reusable buttons, dialogs, and toast primitive
    Logo.tsx
    icons.tsx
  features/
    polls/api/         Poll data access and API tests
    polls/hooks/       Poll loading and realtime subscriptions
    blog/server/       Content reader, cached rendering, and content tests
    blog/types.ts      Article contracts and translation selection
  domain/polls/        Pure poll types, business rules, and tests
  lib/                 Configuration, Supabase client, translations, and utilities
  content/posts/       Keystatic-managed articles
```

## Ownership

- Keep pages and layouts focused on routing, metadata, and composition.
- Put every reusable React component in `components`, grouped by purpose.
- Keep data access and application hooks in `features`; keep pure poll rules in
  `domain/polls`. Tests live beside the code they verify.
- Components can use feature APIs, hooks, domain rules, and shared utilities.
  Features and components must not import route implementation from `app`.
- UI primitives and `lib` stay independent of features, domain, and routes.
  Domain code stays independent of framework and infrastructure code.
- Use `@/` for imports between folders; relative imports are fine within a folder.
- Blog server rendering stays behind its `server-only` entry point. Client UI
  imports article types without importing the filesystem reader or CMS config.

The `(site)` route group preserves shared authentication and locale across pages.
The `(admin)` group retains the editor's independent document. Neither group
changes public URLs. The homepage and blog use the site footer; `p/layout.tsx`
owns the poll theme and compact footer. The global 404 reuses the site document
and its not-found page.

## Validation

Run `npm test`, `npm run lint`, and `npm run typecheck`; run `npm run build`
for production validation. Typecheck regenerates Next.js route definitions first.
The existing browser fixture suite is documented in [voter parity](voter-parity.md).
Use `PICKLE_SCREENSHOT_DIR` with an ignored output folder to preserve reference images.

On Windows, the Next.js config requests the worker-thread CSS loader runtime.
Affected Node.js versions automatically fall back to child processes; the known
CSS worker startup failure may prevent local production-build validation.
