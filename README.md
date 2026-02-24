# Admin Dashboard Frontend

Admin web application for managing users, products, categories, and audit activity.

## Stack

- React 19 + TypeScript
- Vite 7
- React Router 7
- TanStack Query 5
- Axios
- Tailwind CSS + Radix UI

## Requirements

- Node.js 20+
- Yarn 1.x (lockfile is `yarn.lock`)

## Quick Start

```bash
yarn
cp .env.example .env
yarn dev
```

App runs on Vite default host/port unless overridden.

## Environment Variables

Required:

- `VITE_API_BASE_URL`: Base URL for backend API (example: `http://localhost:3000/api/v1`)

Validation is enforced in `src/lib/env.ts`; app boot fails when required values are missing.

## Scripts

- `yarn dev`: Start local dev server
- `yarn dev:staging`: Start dev server using staging mode
- `yarn build`: Type-check and build for production
- `yarn build:staging`: Type-check and build using staging mode
- `yarn preview`: Preview production build
- `yarn preview:staging`: Preview staging build
- `yarn lint`: Run ESLint
- `yarn format`: Format with Prettier
- `yarn format:check`: Check formatting

## Project Structure

```text
src/
  api/          # Typed API clients and request contracts
  app/          # Router and app-level providers
  components/   # Shared and UI components
  features/     # Domain features (auth, users, products, etc.)
  lib/          # Utilities, env parsing, storage, helpers
  pages/        # Top-level fallback pages
```

## Route Overview

- `/login`
- `/reset-password`
- `/` (dashboard, `ADMIN|STAFF`)
- `/users` (`ADMIN`)
- `/users/:id`
- `/products` (`ADMIN|STAFF|VIEWER`)
- `/products/:id`
- `/categories` (`ADMIN|STAFF|VIEWER`)
- `/audit-logs` (`ADMIN|STAFF`)

## Authentication

- Access/refresh token flow via Axios interceptors (`src/api/client.ts`)
- On `401`, client attempts refresh at `/auth/refresh`
- Queues in-flight requests during token refresh to prevent duplicate refresh calls
- On refresh failure, local tokens are cleared and logout event is emitted

## Documentation

- [Architecture](docs/architecture.md)
- [API Contracts](docs/api-contracts.md)
- [Development Guide](docs/development.md)
- [Operations Guide](docs/operations.md)
