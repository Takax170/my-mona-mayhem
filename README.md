🌐 English | [Español](README.es.md) | [Português (Brasil)](README.pt_BR.md) | [한국어](README.ko.md)

# 🎮 Mona Mayhem

**VS Code & GitHub Copilot CLI Workshop** — Build a GitHub Contribution Battle Arena

A workshop template for building a retro arcade-themed website with Astro that compares GitHub contribution graphs of two users. This is the **starting point** — you'll build the app step by step using GitHub Copilot.

![Mona Mayhem Screenshot](https://github.com/user-attachments/assets/5eca79e2-cb9f-4e93-aa0d-23666ebde3b7)
*What you'll build by the end of the workshop*

## 📚 Workshop

The workshop supports two tracks — follow the one that matches your preferred workflow:

- **VS Code track** — Chat, Plan Mode, Agent Mode, background agents, and editor-native review loops
- **CLI track** — `copilot`, `@file` context, `/plan`, autonomous edits, `/fleet`, `/delegate`, and `/review`

| Part | Title | Copilot Focus |
|------|-------|---------------|
| [00](workshop/00-overview.md) | Overview | Track selection and learning goals |
| [01](workshop/01-setup.md) | Setup & Context Engineering | Instructions, permissions, and environment setup |
| [02](workshop/02-plan-and-scaffold.md) | Plan & Scaffold | Planning the API and page architecture |
| [03](workshop/03-agent-mode.md) | Build the Game | Agentic implementation and iteration |
| [04](workshop/04-design-vibes.md) | Design-First Theming | Visual design planning and implementation |
| [05](workshop/05-polish.md) | Polish & Parallel Work | Parallelism, reviews, and quality passes |
| [06](workshop/06-bonus.md) | Bonus & Extensions | Open-ended feature ideas and extra Copilot experiments |

## 🚀 Quick Start

1. **Create your own repo first** by either:
   - clicking **Use this template** to create a new repo, or
   - forking this repository.
2. Choose your workshop path:
   - **VS Code:** clone your repo and open it in VS Code.
   - **GitHub Copilot CLI:** clone your repo locally, install `copilot`, and work from your terminal.
3. Follow the [workshop guide](workshop/00-overview.md)

## Prerequisites

### Shared

- GitHub Copilot (Pro, Business, or Enterprise)
- Git
- Node.js

### VS Code track

- VS Code v1.107+
- GitHub Copilot extension signed in

### CLI track

- GitHub Copilot CLI (`copilot`)
- Node.js 22+ if you plan to install the CLI via `npm install -g @github/copilot`
- Or Homebrew / WinGet if you prefer a native package manager install

## Technology Stack

- **Framework**: [Astro](https://astro.build/) v6
- **Runtime**: Node.js with [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) adapter
- **Font**: Press Start 2P (retro gaming font)
- **API**: GitHub's contribution graph API

## Deployment Notes

### GitHub Pages

The workflow in `.github/workflows/deploy.yml` tests, builds and deploys the
Astro application on every push to `main`, or on manual dispatch. In the
repository's **Settings > Pages**, select **GitHub Actions** as the build source.
The expected URL for this repository is
<https://takax170.github.io/my-mona-mayhem/>.

`npm run build:pages` produces static files in `dist/`. The configuration uses
`GITHUB_REPOSITORY` (default: `Takax170/my-mona-mayhem`) to set the Pages domain
and repository base path. Unlike the former deployment, it publishes the app,
not the standalone workshop site in `docs/`.

Pages cannot execute API routes. In this build only, the browser calls
`https://github.com/{username}.contribs` directly using GitHub's public CORS
support. It reuses the same username and payload validation, timeout, error
handling and in-memory cache as the server service. No token or third-party
proxy is needed; GitHub availability and CORS support are required.

### Node hosting

`npm run dev`, `npm run build` and `npm run preview` retain the Node server
configuration and same-origin `/api/contributions/:username` proxy. After
building, run `node dist/server/entry.mjs` on a Node host.

## License

MIT
