# Contributing to RepoPulse

Thanks for your interest in contributing to RepoPulse! This guide will help you get started.

## Getting started

1. Fork the repository and clone your fork
2. Install dependencies: `npm install`
3. Create a GitHub OAuth App with callback URL `http://localhost:3000/api/auth/callback`
4. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in your environment
5. Start the dev server: `npm run dev`

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full setup instructions.

## Finding something to work on

- Browse issues labeled [`good first issue`](https://github.com/arun-gupta/repo-pulse/labels/good%20first%20issue) for beginner-friendly tasks
- Check the [Phase 2 roadmap](docs/DEVELOPMENT.md#phase-2-feature-order) for upcoming features
- Look at open [enhancement](https://github.com/arun-gupta/repo-pulse/labels/enhancement) issues

## Development workflow

RepoPulse uses a specification-driven development (SDD) workflow. Before implementing a feature:

1. Read [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) for the full workflow, tech stack, and verification commands
2. Read [`docs/PRODUCT.md`](docs/PRODUCT.md) for product definitions and acceptance criteria

### Running tests

```bash
npm test              # run all tests
npx vitest run        # single run
npx tsc --noEmit      # type check
```

### Code style

- TypeScript strict mode — no `any`, no untyped values
- No `console.log` in committed code
- No TODOs or dead code in PRs
- Tests are required for new logic

## Submitting a pull request

1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure all tests pass and types check
4. Open a PR with a clear description and test plan
5. Every item in the PR test plan must be verified before merge

## Reporting issues

Open a [GitHub issue](https://github.com/arun-gupta/repo-pulse/issues/new) with:
- A clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
