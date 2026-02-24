# Development Guide

## Local Setup

1. Install dependencies:

```bash
yarn
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
yarn dev
```

## Commands

- `yarn dev`
- `yarn dev:staging`
- `yarn build`
- `yarn build:staging`
- `yarn preview`
- `yarn preview:staging`
- `yarn lint`
- `yarn format`
- `yarn format:check`

## Coding Conventions

- Use TypeScript types/interfaces for all API responses and inputs.
- Keep API calls in `src/api/*`; do not call Axios directly from feature components.
- Keep access control in routing and dedicated auth guard components.
- Prefer feature-local files under `src/features/<domain>`.
- Keep shared UI primitives in `src/components/ui`.

## Feature Development Checklist

When adding a new feature:

1. Add or extend typed API module in `src/api`.
2. Add page/dialog components in `src/features/<feature>`.
3. Add route in `src/app/router.tsx` with required guards.
4. Reuse `src/components/shared`/`src/components/ui` components where possible.
5. Update `docs/api-contracts.md` for any new endpoint usage.
6. Run `yarn lint` and `yarn build` before opening a PR.

## API Layer Checklist

For each new API wrapper:

- Export input/output types
- Keep params typed and explicit
- Return `res.data`
- Avoid logging in production paths

## Pull Request Checklist

- Scope is focused and reversible
- Route guards match expected roles
- Loading/error/empty states are handled
- Lint and build pass locally
- Documentation updated (`README.md` and `docs/*` as needed)
