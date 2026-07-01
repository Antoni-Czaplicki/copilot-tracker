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

## 2026-07-01 - Auth Failure Hints

- Added safe, code-specific Azure OAuth failure hints for stable callback codes such as `invalid_client`, `invalid_oauth_state`, and `profile_or_org_check_failed`.
- Reused the shared auth callback sanitizer on the homepage instead of duplicating sanitization logic.
- Added tests for common auth failure hints and unknown-code suppression.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (22 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with current placeholder production env names

## 2026-07-01 - Extension Partial Token Cost Display

- Added incomplete-token request counting for the current session status tooltip.
- Changed session tooltip copy from exact total/cost wording to captured total and lower-bound cost when token capture is partial or missing.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Extension Test Suite Cleanup

- Replaced the placeholder VS Code sample test with a real cost-estimation regression for known model input/output token pricing.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Admin Export Validation Order

- Moved admin export `type` validation before `readDatabase()` so unsupported export requests return 400 without loading full export data.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Admin Export Test Coverage

- Extracted admin export CSV/type helpers into `apps/web/src/lib/adminExport.ts` so export behavior can be tested without a Next route harness.
- Added coverage for export type parsing, CSV quoting, captured-only placeholder filtering, and GitHub billing export rows.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with current placeholder production env names

## 2026-07-01 - Extension Server URL Validation

- Tightened `parseTrackerServerUrl` so the extension only accepts safe server origins.
- Server URLs with paths, credentials, query strings, fragments, malformed values, or non-local HTTP now fail clearly instead of being partially ignored.
- Added regression tests for valid HTTPS/local origins and invalid URL shapes.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Extension IPv6 Localhost Server URL

- Fixed tracker server URL validation so `http://[::1]:3737` is treated as a local development server.
- Added a parser regression assertion for IPv6 localhost.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Extension Event User Privacy

- Stopped sending the local OS username in extension tracker events.
- New events use a generic `vscode-extension` client label while the backend continues stamping authenticated Azure DevOps user identity.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Azure DevOps Work-Item Query Hardening

- Exported and tested the Azure DevOps WIQL query builder.
- Clamped non-finite and out-of-range work-item search limits to safe bounds.
- Rejected unsafe numeric work-item IDs such as `0`, values above Azure/PostgreSQL integer bounds, and giant digit strings instead of emitting invalid WIQL.
- Preserved apostrophe escaping for title searches and tested both `CONTAINS WORDS` and fallback `CONTAINS` query shapes.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Extension Upload Cache Server Scope

- Scoped OTel upload cache entries by hashed tracker server origin as well as workspace id.
- This prevents switching `copilot-tracker.serverUrl` from skipping unchanged historical records that the new server has never received.
- Added/updated extension tests for per-workspace and per-server cache isolation.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Deployment Contract Documentation

- Added `docs/deployment.md` with the production Docker/Dokploy environment contract, build metadata requirements, Azure app registration checklist, and smoke checks.
- Linked the deployment guide from README.
- Updated compose build/runtime metadata args to read `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME` from the environment with local fallbacks.
- Added `.codex` to `.dockerignore` so nightly QA logs are not copied into Docker build contexts.

## Checks

- PASS: `docker compose config`
- PASS: `git diff --check`

## 2026-07-01 - Work Item Picker Debounce UX

- Changed `WorkItemPicker` to track which query produced the current results.
- Hides stale work-item results when the user edits the query and shows `Searching` while the new debounced search is pending.
- Keeps empty "No matches" feedback for completed searches only.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Web Domain Test Harness

- Added a lightweight web test harness using Node's built-in test runner with `tsx`.
- Added CI coverage for the new web test command before the production web build.
- Extracted auth callback value sanitization into a small helper so it can be tested without Next response plumbing.
- Added 12 tests covering auth callback code sanitization, payload token integer bounds, batch size caps, task assignment schema trimming, GitHub username normalization, and cost estimation/formatting.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Extension OTel Upload Cache

- Added a per-workspace request upload signature cache for Copilot OTel syncs.
- Excluded volatile `capturedAt` from signatures so repeated reads of the same OTel records do not repost unchanged batches.
- Kept stable metadata such as selected task, token counts, model fields, and session title in the signature so real changes still reupload.
- Persisted cache state after successful upload/no-op and capped tracked request signatures to the latest 5,000 records.
- Added extension tests for unchanged-record skipping, metadata-change reupload, and per-workspace cache storage.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Admin Billing Sync UX

- Replaced the admin GitHub billing sync raw endpoint link with an in-page client action.
- Added loading, success, and error states and refresh the admin data after a successful sync.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Compose App Service

- Added an `app` service to `docker-compose.yml` so local/container smoke can model the app, DB health dependency, app port, and runtime env contract together.
- Documented `docker compose up --build app` for containerized app+DB smoke testing.

## Checks

- PASS: `docker compose config`
- BLOCKED: `docker compose up`/image build still cannot run because the Docker daemon is unavailable

## 2026-07-01 - Branch Task Detection Copy Alignment

- Updated README and homepage copy to match the safer branch task parser.
- Removed stale documentation saying unmatched branches fall back to the full branch name.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

## 2026-07-01 - Full Current-Head Verification

- Re-ran full local validation after loop 2 commits.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and build metadata

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

## 2026-07-01 - Web Task Clearing UX

- Added `selectedTask: null` support to task assignment payloads and store updates so web task assignments can be cleared.
- Added clear actions for single request rows, selected requests, and whole sessions.
- Kept cleared rows displaying the branch-derived default task when one exists.
- Added schema coverage for nullable task assignment payloads.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (20 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with current placeholder production env names

## 2026-07-01 - Extension Log Privacy

- Redacted local workspace/repository/storage/file fields from structured extension logs.
- Redacted token-like fields while preserving useful non-sensitive context such as branch names and request counts.
- Updated `Show Current Context` to report repository/storage presence without displaying raw local paths or remotes.
- Added a regression test for path, remote URL, nested storage path, file, and token redaction.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

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
