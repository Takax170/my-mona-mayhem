# Mona Mayhem

## Commands

Run from the repository root with Node.js >=22.12.0 and npm.
The lockfile is `package-lock.json`; the devcontainer installs with `npm ci`.

| Task | Command |
| --- | --- |
| Install dependencies | `npm ci` |
| Start the Astro app | `npm run dev` (http://localhost:4321) |
| Build the server app | `npm run build` |
| Build the static Pages app | `npm run build:pages` |
| Preview the build | `npm run preview` |
| Run all tests | `npm test` |
| Run the proxy test file | `npm test -- tests/contributions.test.mjs` |
| Run only cache tests | `npm test -- --test-name-pattern="cache" tests/contributions.test.mjs` |
| Run the standalone production server after building | `node dist/server/entry.mjs` |
| Manually check one API route with the dev server running | `curl -i http://localhost:4321/api/contributions/octocat` |

The API smoke check returns HTTP 200 with normalized contribution data when
GitHub is available. `curl -i http://localhost:4321/api/contributions/-invalid`
checks the HTTP 400 validation response without contacting GitHub.
Tests use Node's built-in runner and native TypeScript stripping, with mocked
GitHub responses and a controlled clock; no network is required.
Workshop verification steps live in `workshop/02-plan-and-scaffold.md` and
`workshop/03-agent-mode.md`.

## Architecture

This is a workshop starter extended into a PSP XMB-style battle UI (no music
features). `src/pages/index.astro` is a system-like shell: a desktop handheld
bezel (full-bleed below 1024px), the canvas wave background
(`src/components/xmb/WaveBackground.astro`), a skippable once-per-session boot
screen (`src/components/xmb/BootScreen.astro`, sessionStorage
`monaMayhemBooted`), and horizontal categories (Battle, Results, Settings, History) with
vertical items. Arrow keys, Enter, Escape/Backspace and touch swipes navigate;
tabs use roving tabindex and `aria-selected`. `XmbIcon.astro` renders a fixed
set of MIT-licensed Phosphor fill SVGs on the server (no client icon library).
Their license is retained in `public/third-party-licenses.txt`. OpenXMB is a
visual reference only; its PNGs are not bundled.
Keep category and item icons in this family rather than drawing ad hoc SVGs.
The current item uses `data-selected`, updated on focus; clicking its free
space focuses the control. A bottom strip documents keyboard/touch controls.
Browser TypeScript submits both
same-origin API requests in parallel and shows results only when both succeed,
with pulsing skeletons and per-player errors. Results reveal suspensefully
(count-up, staggered grids, Winner/Draw from `src/lib/battle-outcome.ts`,
comparing each player's returned-period totals); reduced motion makes it instant.
Results place players side by side from 768px up and stack compactly on mobile.
`src/lib/battle-history.ts` validates and formats completed battle summaries.
History keeps the latest 20 results in localStorage (`monaMayhemBattleHistory`),
newest first, with confirmed clearing and a "Use players" action. Failed battles
are not recorded; storage errors are surfaced without breaking a successful battle.
"Share Results" uses `navigator.clipboard.writeText` after user activation,
shows a short live confirmation, and reports permission/unavailable errors.
Each profile has a Sunday-first contribution table (12px GitHub-colored squares,
a shared custom date/count tooltip, and sr-only text).
`src/lib/contribution-grid.ts` validates the browser payload and aligns partial
weeks without inventing days. Synthesized Web Audio UI sounds
(`src/lib/xmb-sound.ts`) start only after a user gesture. Sound, volume and boot
preferences persist via `src/lib/xmb-settings.ts` (localStorage
`monaMayhemXmbSettings`).

The app uses Astro 6 with strict TypeScript (`astro/tsconfigs/strict`) and ES
modules (`"type": "module"`). `astro.config.mjs` selects server output with
`@astrojs/node` in standalone mode. File-based routes under `src/pages/` serve
both the page and the API; static app assets live in `public/`.

`src/pages/api/contributions/[username].ts` maps to
`/api/contributions/:username`. It exports an Astro `APIRoute` GET handler and
explicitly disables prerendering. The data flow is browser battle UI ->
this same-origin API -> `https://github.com/{username}.contribs`, keeping the
upstream fetch server-side to avoid browser CORS restrictions.
`src/lib/contributions.ts` validates usernames and GitHub's `v2` JSON, derives
daily dates in UTC, and returns camelCase data with dated, colored contribution
weeks. It applies a 10-second timeout, deduplicates concurrent requests for the
same lowercase username, and caches successes for five minutes in a per-instance
500-user FIFO cache. Expired data and failures are never cached or served as
successes. The route returns `{ error: { code, message } }` for errors and
`Cache-Control: no-store` on all handler responses; only the server memory is
cached. In the default Node build, the browser uses the same-origin proxy. In the
Pages build (`PUBLIC_GITHUB_PAGES=true`), it reuses this service in the browser
and calls GitHub directly, relying on GitHub's public CORS support.
The main page uses scoped native CSS with a single blue XMB theme, collapsing
below 768px. Scoped `display` rules override `hidden`, so keep the explicit
`[hidden]{display:none}` rules.
Styles for dynamically created table elements use `:global()` selectors limited
to the graph containers, since browser-created nodes do not have Astro's scope
attributes. Grid helpers have focused Node tests in `tests/contribution-grid.test.mjs`;
outcome, settings, history parsing/retention and sharing summaries are tested in
`tests/xmb.test.mjs`.

There are two separate web surfaces:

- The Astro app in `src/` is the application being built.
- `docs/` is a standalone HTML/CSS/JavaScript workshop site. Its step viewer
  fetches workshop Markdown and renders it in the browser with Marked. It is not
  served or built by Astro. `.github/workflows/deploy.yml` now tests and builds
  the Astro app with `npm run build:pages` and deploys `dist/` on pushes to main;
  the workshop site is no longer the Pages deployment.

Keep the default Node server configuration for runtime API routes. The separate
Pages build sets the repository base path and omits runtime API endpoints;
see the README's deployment notes.

## Repository-specific conventions

- Workshop Markdown contains paired `<!-- track:vscode:start -->` /
  `<!-- track:vscode:end -->` and `<!-- track:cli:start -->` /
  `<!-- track:cli:end -->` markers. Preserve these exact, balanced markers:
  `docs/step.html` and localized viewers filter them before rendering. Track
  selection travels through the `track` query parameter and
  `monaMayhemWorkshopTrack` localStorage key.
- Documentation changes are distinct from app changes. The English viewer
  fetches local workshop files on localhost, but uses the upstream
  `copilot-dev-days/mona-mayhem` raw GitHub URLs on hosted domains. Account for
  that source selection when checking documentation changes in this fork.
- English localization sources are `README.md`, `workshop/**/*.md` excluding
  locale subdirectories, and `docs/index.html` / `docs/step.html`. Existing
  repository locales are `es`, `pt_BR`, and `ko`: README translations use
  `README.<locale>.md`, workshop translations use `workshop/<locale>/`, and HTML
  translations use `docs/<locale>/`. Language-picker code uses `pt-BR`, while
  the directory name remains `pt_BR`.
- For localization work, read `.github/skills/localizations/SKILL.md`, its
  matching locale rule, and `.github/workflows/localization-sync.yml`. The
  workflow's repository-specific output mappings take precedence over the
  skill's default `localizations/<locale>/` content layout. Preserve code,
  commands, track markers, and external URLs; adjust relative assets and
  workshop links for the translated file's actual location.
- Localization state in `localizations/<locale>/.localization-state.json`
  records per-source commit IDs and source/output SHA-256 fingerprints.
  Preserve human edits and reconcile unknown baselines instead of blindly
  retranslating. In automated synchronization, the trusted workflow and
  `scripts/localization_sync.py` own baseline recording and verified deletions;
  the translation step must not edit that metadata.
