# Architecture

## Goals

This frontend provides an admin interface for:

- Authentication and access control
- User management
- Product and category management
- Audit log review
- Dashboard KPI visibility

## High-Level Design

Core layers:

- `src/features`: Feature-level pages and feature UI
- `src/api`: Typed API wrappers by domain
- `src/components`: Reusable UI and layout building blocks
- `src/app`: Router and global providers
- `src/lib`: Shared infrastructure helpers

Typical request flow:

1. Page component in `src/features/*` triggers a query or mutation
2. Typed function in `src/api/*` calls Axios instance
3. Axios instance injects auth token and handles refresh/retry
4. Feature component renders normalized response types

## Routing and Access Control

Defined in `src/app/router.tsx`.

- `Protected` wraps authenticated routes
- `RequireRole` enforces role-based access for specific routes
- Roles in use: `ADMIN`, `STAFF`, `VIEWER`

## Auth and Session Lifecycle

Implemented across:

- `src/api/client.ts`
- `src/features/auth/auth.store.ts`
- `src/features/auth/auth.events.ts`
- `src/lib/storage.ts`

Behavior:

- Access token attached to each request when available
- On first `401`, request is retried after refresh
- Refresh requests are deduplicated with a shared queue
- Refresh failure clears tokens and emits logout event

## API Layer Rules

Current pattern in `src/api/*`:

- Export request/response types from each API module
- Keep transport details in API modules, not in page components
- Return `res.data` from wrappers to keep consumers clean

Recommended consistency rules:

- Avoid `console.log` in API modules
- Use one shared `Paged<T>` type or centralize it in a shared type file
- Keep endpoint params narrow and explicitly typed

## UI Composition

- `src/components/ui`: primitive design-system style components
- `src/components/shared`: reusable domain-agnostic composites
- `src/components/layout`: app shell, sidebar, topbar
- `src/components/auth`: auth and role guard components

## Domain Modules

- `src/features/auth`
- `src/features/dashboard`
- `src/features/users`
- `src/features/products`
- `src/features/categories`
- `src/features/audit`

Each module should own:

- Screens/pages
- Feature-local query keys
- Feature-local dialogs/forms
- Mapping between API shapes and view models when needed

## Environment and Runtime Config

- Environment parsing in `src/lib/env.ts`
- Required variable: `VITE_API_BASE_URL`
- API client base URL sourced from environment at startup
