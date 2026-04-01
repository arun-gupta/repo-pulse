# ForkPrint

ForkPrint is a CHAOSS-aligned GitHub repository health analyzer being built in phases. The long-term goal is to accept one or more `owner/repo` inputs, fetch real public data via the GitHub GraphQL API, and produce an interactive dashboard and raw JSON output.

Production deployment: [forkprint-arun-gupta.vercel.app](https://forkprint-arun-gupta.vercel.app)

## Roadmap

| Phase | Platform | Status |
|-------|----------|--------|
| 1 | Next.js web app (Vercel) | In progress |
| 2 | GitHub Action (scheduled analysis + alerting) | Planned |
| 3 | MCP Server (callable by Claude, Cursor, etc.) | Planned |

## Setup

ForkPrint currently supports a GitHub Personal Access Token with `public_repo` read-only scope. In shared deployments, you can also configure `GITHUB_TOKEN` server-side to hide the PAT field.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Local Development

For local development, you can optionally create `.env.local` with:

```bash
GITHUB_TOKEN=
```

If `GITHUB_TOKEN` is not set locally, the app falls back to the existing PAT flow in the browser.

## Planned Product Capabilities

- Analyze GitHub repos across four CHAOSS categories: **Ecosystem**, **Evolution**, **Sustainability**, and **Responsiveness**
- Visualize repos with an interactive ecosystem view and profile summaries
- Compare multiple repos side by side across all health metrics
- Export results as JSON or Markdown

## Development

Built with SpecKit / Specification-Driven Development.

- Development workflow, feature order, current implementation status, and testing commands: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- Product definition and planned feature set: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- Phase 1 Vercel deployment guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Project rules: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
