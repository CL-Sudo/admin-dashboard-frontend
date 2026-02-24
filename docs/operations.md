# Operations Guide

## Environments

This project currently supports mode-based runs:

- Development: default `vite` mode
- Staging: `--mode staging` scripts
- Production: built assets from `yarn build`

Environment variables are resolved via Vite mode files:

- `.env`
- `.env.development`
- `.env.staging`

## Critical Runtime Configuration

- `VITE_API_BASE_URL` must point to the correct backend API base URL per environment.

If missing, app startup fails because environment parsing in `src/lib/env.ts` treats it as required.

## Build and Verify

```bash
yarn lint
yarn build
```

Staging verify:

```bash
yarn build:staging
yarn preview:staging
```

## Deployment Notes

- `vercel.json` exists in this repository.
- Ensure environment variables are set in deployment platform for each environment.
- Use build output from Vite (`dist/`).

## Release Checklist

1. Confirm backend URL for target environment.
2. Run lint and production build.
3. Verify key routes:
   - `/login`
   - `/`
   - `/users`
   - `/products`
   - `/categories`
   - `/audit-logs`
4. Verify auth lifecycle:
   - Login success
   - Token refresh path on expired access token
   - Logout and forced logout on refresh failure
5. Smoke test role-based pages for `ADMIN`, `STAFF`, `VIEWER`.

## Incident Triage Shortlist

If users report data/auth issues:

1. Validate `VITE_API_BASE_URL` in deployed environment.
2. Check network responses for `401` loops and refresh failures.
3. Confirm `/auth/refresh` backend behavior and token issuance.
4. Check role claims in access token payload for authorization mismatches.
