# Web architecture

The web project has two surfaces: marketing and articles, and
public voting. Next.js owns routing and composition; features own their behavior.

## Source map

```text
src/
  app/
    (site)/
      layout.tsx             Shared document, fonts, metadata, and providers
      (marketing)/           Landing page and blog; marketing footer
      (product)/             /p; product theme and compact footer
    (admin)/                 Isolated Keystatic document and editor
    _components/             Provider setup and cross-feature composition
    api/keystatic/           CMS route handler
    globals.css              Shared tokens, fonts, and styles
  domain/polls/              Framework-independent poll types and rules
  features/
    auth/                    Session context, identity, and email sign-in UI
    polls/                   Ballot API, live-update hook, and voting/results UI
    blog/                    Content reader, cached server rendering, and article UI
    marketing/               Landing page, navigation, and promotional UI
  components/                Reusable UI primitives, icons, and logo
  lib/                       Supabase client, locale runtime, config, and utilities
  content/posts/             Keystatic-managed content; keep these CMS paths stable
```

Route groups do not change URLs. Marketing and product routes share the same site
root, so navigation preserves locale, toast, and authentication state. Each nested
layout owns its appearance and footer, without pathname checks. The CMS keeps its
separate root document. The global 404 explicitly composes the marketing layout.

## Dependencies and ownership

- `app` composes features. Pages stay small: route parameters, metadata, data loading,
  and the feature entry component.
- `domain/polls` contains only poll contracts and pure business rules. Voter code depends on it; it does not import feature, infrastructure, or UI code.
- `features` colocates UI, data access, hooks, models, copy, and their tests by owner.
  Feature code does not import routing implementation from `app`.
- `components` and `lib` are shared foundations. They do not depend on features,
  domain code, or route modules. Keep feature-specific helpers with their feature.
- Marketing uses shared CTA translations and poll result components for the landing preview.
- `app/_components/PollExperience.tsx` composes the public voting screen.

`scripts/eslint-architecture.mjs` enforces these import boundaries for both aliases
and relative imports, including re-exports and dynamic imports. Cross-directory
source imports use `@/`; imports inside the same directory can be relative. Avoid
barrel files that mix client UI with server content readers or pull whole features
into shared bundles.

## Runtime boundaries

The blog's `posts.tsx` is a `server-only` cached entry point; its content reader and
Keystatic config stay on the server. Blog types can be imported by client article
components. Content location and output tracing remain unchanged.

The Supabase singleton remains in `lib/supabase.ts`. The ballot API
lives in the polls feature. Existing RPC names, payloads, session behavior,
refresh recovery, and polling/realtime fallbacks are preserved. This reorganization
does not require a database migration or deployment configuration change.

## Adding and checking work

Put a new behavior in its owning feature and add a route only when it needs a URL.
Promote a helper to `lib` or a component to `components` when it serves multiple
features without depending on one. Extend `domain/polls` for shared poll rules.
Keep tests beside the API or model they exercise.

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
The typecheck command generates current Next.js route definitions before running
TypeScript, so moving route groups does not leave stale generated imports.
For browser regressions, run the existing fixture suites described in
[voter parity](voter-parity.md).
Set `PICKLE_SCREENSHOT_DIR` to an ignored directory such as
`.next/architecture-screenshots` to capture validation without replacing the
committed reference images.

On Windows, the config uses Turbopack's `workerThreads` plugin runtime. During this
refactor, the default CSS-loader child process exited before connecting to its IPC
socket, including in a minimal reproduction. Worker threads allow CSS compilation
to finish on Node.js 22.13.0. Next.js automatically falls back to child processes on
Node.js versions affected by its documented worker teardown issue; no forced
worker-thread override is used.
