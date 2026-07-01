# Nightly QA Changes

## 2026-07-01 - Extension Task/Search/Dashboard Hardening

- Tightened `getTaskFromBranch` so detached commit labels and version-like branch names do not become false task IDs.
- Added branch parser regression assertions for prefixed work items, detached hashes, and version-style names.
- Guarded Azure DevOps Quick Pick async search updates after the picker settles, reducing race risk after accept/cancel/hide.
- Added active-editor-change context refresh so multi-root workspace task/branch status updates immediately when the active folder changes.
- Reused tracker server URL validation in `openDashboard` and surfaced malformed server URLs through a friendly VS Code error with settings/log actions.

## Checks

- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## 2026-07-01 - OAuth Callback Failure Hardening

- Wrapped the Azure DevOps OAuth callback so all callback failures after entry clear PKCE/state cookies instead of leaving a half-open flow.
- Stopped reflecting provider `error_description` or other free-form diagnostics into public redirect URLs and homepage UI.
- Converted provider-denied/error callbacks to stable client-visible error codes.
- Preserved controlled failure redirects for invalid state, token exchange failures, profile/org check failures, misconfiguration, and unexpected callback failures.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`

## 2026-07-01 - Extension Partial Token Cost Display

- Added incomplete-token request counting for the current session status tooltip.
- Changed session tooltip copy from exact total/cost wording to captured total and lower-bound cost when token capture is partial or missing.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Extension Workspace Task Isolation

- Removed the deprecated global selected-task fallback from workspace context resolution so manual task overrides cannot leak into unrelated workspaces.
- `setSelectedTask` still clears the legacy key when users choose a task, preserving forward cleanup.

## Checks

- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## 2026-07-01 - Deployment Health and Secret Contract

- Added `GET /api/health` with DB readiness, build SHA, build time, and current timestamp.
- Added Docker build/runtime metadata arguments and a container `HEALTHCHECK` against `/api/health`.
- Added a CI web production build step with safe placeholder env values.
- Added `apps/web/.env.example` for local/production env onboarding.
- Required `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` for production Azure DevOps auth and removed the Azure client-secret fallback for token encryption.
- Updated README to document the dedicated encryption key and health endpoint.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata
- PASS: local `next start` health smoke returned `503` with `database.ok=false` and build SHA when no local database was available
- BLOCKED: Docker image build could not run because the local Docker daemon socket was unavailable

## 2026-07-01 - API Boundary Validation

- Added malformed JSON handling for user and admin GitHub login PATCH routes.
- Added admin export `type` whitelist validation so unknown export types return 400 instead of silently dumping request CSV.
- Added billing sync `date` validation for real `YYYY-MM-DD` calendar dates before reaching GitHub sync logic.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Batch Ingest Response Counts

- Changed `/api/chat-requests/batch` so `accepted` reports processed/upserted unique requests instead of raw received payload count.
- Kept `received` in the response for raw input visibility.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`

## 2026-07-01 - Drizzle Migration Env Contract

- Removed the silent localhost `DATABASE_URL` fallback from `apps/web/drizzle.config.ts`.
- Drizzle migrations now fail fast with a clear error when `DATABASE_URL` is absent.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Request Grid Task Editing UX

- Made single-request task editing reachable in `RequestSessionsGrid` by rendering the existing `TaskEditor` in the task column.
- Upgraded `TaskEditor` to use Azure DevOps `WorkItemPicker`, surface save errors, clear stale status on edits, and notify the grid after confirmed saves.
- Added horizontal overflow around the request table so wide request/session rows remain usable on narrow screens.
- Made bulk/session assignment reject a 2xx response with `updated: 0` instead of optimistically showing unpersisted local changes.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Token Payload Integer Bounds

- Added PostgreSQL `integer` upper bounds to token count payload validation so oversized token values fail schema validation before DB insert.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Leaderboard Privacy Gate

- Restricted `/leaderboard` to admins while preserving the existing feature flag.
- Hid the leaderboard nav link from non-admin signed-in users.
- Updated README wording from authenticated leaderboard to admin-only leaderboard.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata
