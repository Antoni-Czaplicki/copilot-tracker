# Nightly QA Changes

## 2026-07-01 - Docker Build Metadata Fallback

- Added `scripts/write-build-info.mjs` to generate non-secret build metadata from explicit Copilot Tracker env, common source metadata env names, or minimal `.git` `HEAD`/ref metadata.
- Updated Docker builds to write `apps/web/src/generated/buildInfo.generated.ts` before `next build`, then remove `.git` before the final image is copied.
- Changed `.dockerignore` to include only the minimal Git metadata required for SHA resolution instead of the full `.git` directory.
- Updated `/api/health` build metadata lookup to use the generated module as a fallback after explicit runtime env and common source env names, with the generated JSON file fallback retained for compatibility.
- Documented the generated build-info safety net in README and deployment docs while keeping explicit runtime env as the preferred override.
- Added tests for branch-ref metadata, packed-ref metadata, explicit metadata precedence, generated TypeScript module output, generated-file fallback, and env-over-file precedence.

## Checks

- PASS: `pnpm test:smoke` (10 tests)
- PASS: `pnpm --filter @copilot-tracker/web test` (139 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env and no Turbopack broad-tracing warning
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (30 tests)
- PASS: `pnpm test` (10 smoke/script tests + 139 web tests + 30 extension tests)
- PASS: `docker compose config`
- PASS: `git diff --check`
- BLOCKED: full Docker image build could not run because the local Docker daemon socket is unavailable

## 2026-07-01 - Extension OTel Lifecycle Stability

- Added a single-flight queue around extension OTel lifecycle rebuilds so overlapping rebuild requests collapse into one active run and, at most, one queued rerun.
- Tracked the active Copilot OTel file path so normal polling and sync do not repeatedly reconfigure Copilot exporter settings.
- Ignored Copilot OTel config-change events caused by the extension's own exporter writes for a short window, preventing a self-triggered lifecycle feedback loop.
- Reduced noisy exporter logging to actual setting changes while keeping debug visibility for already-configured state.
- Added regression coverage for coalesced lifecycle rebuild behavior.

## Checks

- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (30 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm -r test --if-present`
- PASS: `pnpm test:smoke`
- PASS: GitHub Actions `CI` for `ae3d4e4`
- PASS: GitHub Actions `Build extension` for `ae3d4e4`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha ae3d4e4`

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

## 2026-07-01 - Landing Copy Spacing

- Fixed the homepage task-detection sentence so `feature/124-login` and `all map` render with a space between them.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (22 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with current placeholder production env names

## 2026-07-01 - README API/Task Docs Alignment

- Documented that the web dashboard can clear manual task assignments back to the branch-derived default or no task.
- Expanded the Web API list to include bulk task updates, Azure DevOps work-item search, GitHub login mapping, and all admin export types.
- Updated the documented full-build command with the placeholder env values required by production build validation.

## Checks

- PASS: `git diff --check`

- PASS: documented `pnpm build` command with placeholder production env values

## 2026-07-01 - Extension Partial Token Cost Display

- Added incomplete-token request counting for the current session status tooltip.
- Changed session tooltip copy from exact total/cost wording to captured total and lower-bound cost when token capture is partial or missing.

## Checks

- PASS: `pnpm --filter ./apps/extension test`

## 2026-07-01 - Extension Test Suite Cleanup

- Replaced the placeholder VS Code sample test with a real cost-estimation regression for known model input/output token pricing.
- Updated root `pnpm test` to run both the web `node:test` suite and the extension VS Code test suite.

## Checks

- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm test`

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

## 2026-07-01 - Dashboard Focused-Session Pagination

- Preserved `sessionId` in dashboard task pagination links so a tracker link opened from the extension keeps the focused session while moving between task summary pages.
- Moved task pagination href construction into a tested helper.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (24 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (24 web tests + 10 extension VS Code tests)

## 2026-07-01 - Auth Cookie and PKCE Helper Coverage

- Split auth cookie policy and OAuth PKCE challenge generation into focused helper modules while keeping existing `auth.ts` exports stable.
- Added web `node:test` coverage for secure cookie scheme selection, malformed URL fallback, expired-cookie removal attributes, S256 PKCE format, and fresh verifier generation.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (30 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (30 web tests + 10 extension VS Code tests)

## 2026-07-01 - Azure OAuth Route Coverage

- Added route-level web tests for Azure OAuth start redirects, PKCE cookies, required scopes, provider-error callback privacy, state mismatch handling, and missing code/verifier handling.
- Kept tests on safe placeholder env and avoided live token exchange.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (35 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (35 web tests + 10 extension VS Code tests)

## 2026-07-01 - Azure Token Exchange Coverage

- Added mocked web tests for Azure token exchange request construction, including `code_verifier`, redirect URI, scopes, and session-token parsing.
- Added coverage for Azure JSON token failures mapping into `AzureDevOpsTokenExchangeError`.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (37 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (37 web tests + 10 extension VS Code tests)

## 2026-07-01 - Azure DevOps Work-Item Search Coverage

- Added mocked web tests for work-item search request flow, batch field mapping, WIQL fallback after a 400 response, and repeated 429 rate-limit error mapping.
- Added route coverage for blank work-item queries returning an empty result before auth.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (41 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (41 web tests + 10 extension VS Code tests)

## 2026-07-01 - Extension TrackerClient Coverage

- Added VS Code extension tests for TrackerClient work-item search auth options/request parsing, remote-server no-token blocking, server JSON error messages, and network retry failure messages.
- Expanded the in-memory memento test double to implement `keys()`.

## Checks

- PASS: `pnpm --filter ./apps/extension test` (14 tests)
- PASS: `pnpm test` (41 web tests + 14 extension VS Code tests)

## 2026-07-01 - Health Build Metadata Normalization

- Moved `/api/health` build metadata lookup into a tested `readBuildInfo` helper.
- Treat blank and literal `unknown` values as missing so stale placeholder metadata does not mask useful fallback source metadata.
- Added fallback support for common source commit/time environment names while keeping explicit Copilot Tracker build metadata as the documented production contract.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (44 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (44 web tests + 14 extension VS Code tests)

## 2026-07-01 - Auth Identity and Bearer Parsing Coverage

- Extracted the local disabled-auth admin identity into a shared helper used by both page/session auth and ingest auth.
- Added strict bearer token parsing that accepts canonical case-insensitive `Bearer <token>` headers and rejects empty, Basic, and whitespace/extra-token malformed variants.
- Reused the parser in the Azure DevOps work-item route so malformed bearer headers do not trigger unnecessary upstream Azure calls.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (47 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (47 web tests + 14 extension VS Code tests)

## 2026-07-01 - Azure Profile and Org Lookup Robustness

- Replaced trusted casts on Azure profile/org membership JSON with defensive object/string readers.
- Made malformed Azure profile JSON return `null` from `fetchAzureDevOpsUser`.
- Made malformed Azure org-membership JSON return `false` from the membership check.
- Added tests for profile mapping and org membership via both account name and account URI.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (51 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (51 web tests + 14 extension VS Code tests)

## 2026-07-01 - Azure Token Response Robustness

- Reused defensive JSON/object parsing for successful Azure token and refresh-token responses.
- Made malformed successful token responses and non-string access tokens map to typed `invalid_token_response` failures instead of generic callback failures.
- Made refresh-token responses with malformed payloads fail closed by returning null.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (53 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (53 web tests + 14 extension VS Code tests)

## 2026-07-01 - Payload Schema Coverage

- Added chat request schema coverage for defaulted optional arrays.
- Added prompt-token detail and tool-call round boundary coverage.
- Added tracker event schema coverage for valid payload records, required workspace ids, and known event types.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (57 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (57 web tests + 14 extension VS Code tests)

## 2026-07-01 - Analytics and Dashboard Grouping Coverage

- Added analytics tests for meaningful request filtering, summary metrics, token totals, and estimated cost aggregation.
- Added tests for task summaries, developer task summaries, public leaderboard ranking, and model grouping.
- Added fallback helper coverage for repository names and invalid request activity timestamps.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (63 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (63 web tests + 14 extension VS Code tests)

## 2026-07-01 - GitHub Billing Date Parser Coverage

- Extracted admin GitHub billing sync date parsing into `githubBillingDate`.
- Added tests for valid dates, leap day, missing/default dates, malformed values, and impossible dates.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (66 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (66 web tests + 14 extension VS Code tests)

## 2026-07-01 - Extension Current-Session Token Stats Coverage

- Extracted current-session token aggregation from `extension.ts` into a tested `sessionTokenStats` module.
- Added tests for no completed token totals returning null.
- Added tests for latest tokenized session selection, aggregate input/output/total tokens, incomplete-token request counting, and lower-bound cost calculation.

## Checks

- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm test` (66 web tests + 16 extension VS Code tests)

## 2026-07-01 - WorkItemPicker Helper Coverage

- Extracted task-search threshold logic and Azure DevOps work-item search error messages into tested helpers.
- Added coverage for digit-only IDs, short non-ID search suppression, auth/forbidden/rate-limit messages, and non-JSON fallback messages.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (70 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (70 web tests + 16 extension VS Code tests)

## 2026-07-01 - Extension Pricing Parity

- Added newer web-known model aliases to the extension pricing table so status bar/session cost estimates cover the same current model families.
- Added extension pricing assertions for `gpt-5.4-nano` and `claude-haiku-4.5`.

## Checks

- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm test` (66 web tests + 16 extension VS Code tests)

## 2026-07-01 - Chat Request Merge Coverage

- Extracted chat request batch token normalization and duplicate request-record merge logic from `store.ts` into `chatRequestMerge`.
- Added direct tests for complete/partial/missing token-source normalization.
- Added direct tests that duplicate request records keep the richer telemetry row while filling fallback ids, session titles, prompt-token details, and stop reasons.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm --filter @copilot-tracker/web test` (73 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (73 web tests + 16 extension VS Code tests)

## 2026-07-01 - Request Sessions Grid Model Coverage

- Extracted dashboard request-session grouping, task fallback/override, token capture label, request cost label, and session anchor helpers into `requestSessionsGridModel`.
- Added tests for focused-session ordering and latest-activity ordering.
- Added tests for manual task overrides, clearing back to detected/default tasks, shared session task calculation, token capture labels, unpriced/missing cost display, and DOM-safe session anchors.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm --filter @copilot-tracker/web test` (79 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (79 web tests + 16 extension VS Code tests)

## 2026-07-01 - Extension Status Formatting Coverage

- Extracted status bar and hover formatting helpers from `extension.ts` into `statusFormatting`.
- Added tests for long task truncation, standard and compact token-number display, small USD cost formatting, and lower-bound cost wording for incomplete session token data.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (18 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (79 web tests + 18 extension VS Code tests)

## 2026-07-01 - GitHub Username Mapping Feedback

- Added a reusable GitHub-login mutation error-message helper.
- Updated the GitHub username editor to display safe server validation messages, such as invalid username guidance, instead of only showing `Failed`.
- Added tests for JSON server errors, empty errors, and non-JSON failure responses.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (18 tests)
- PASS: `pnpm --filter @copilot-tracker/web test` (81 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 18 extension VS Code tests)

## 2026-07-01 - Extension Dashboard URL Coverage

- Extracted extension dashboard URL construction into a tested helper.
- Added coverage for base dashboard links, encoded `sessionId` deep links from the status token item, and invalid tracker server origins.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (20 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 20 extension VS Code tests)

## 2026-07-01 - Extension Task History Resolution Coverage

- Extracted task-history parsing and request-time task resolution from `extension.ts` into `taskHistory`.
- Added tests that validate/sort stored history, resolve OTel requests to the latest prior task state, and preserve fallback behavior when manual selections are cleared.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (23 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 23 extension VS Code tests)

## 2026-07-01 - Extension Package License

- Added `apps/extension/LICENSE` so the VSIX package includes a package-local MIT license file.
- Reran extension packaging and confirmed the previous missing-license warning is gone.

## Checks

- PASS: `pnpm --filter ./apps/extension package`
- PASS: `pnpm --filter ./apps/extension lint`

## 2026-07-01 - Task History Resolver Robustness

- Made `createTaskResolverFromHistory` sort a copy of history internally so callers cannot accidentally pass unsorted task history.
- Updated the attribution test to use deliberately unsorted history.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (23 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 23 extension VS Code tests)

## 2026-07-01 - Azure Session Token Helper Coverage

- Extracted Azure DevOps session-token payload parsing and near-expiry checks into `authSessionTokens`.
- Added regression coverage for trimmed token payloads, invalid access tokens, refresh-token fallback during refresh, invalid `expires_in` defaults, and 60-second near-expiry refresh behavior.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (86 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (86 web tests + 23 extension VS Code tests)

## 2026-07-01 - Session Token Crypto Coverage

- Extracted session-token encryption/decryption from `store.ts` into `sessionTokenCrypto`.
- Tightened encrypted token parsing to reject malformed envelopes, invalid base64url segments, invalid IV/tag sizes, and tampered ciphertext.
- Added direct crypto tests while preserving the existing legacy plaintext-read behavior when an encryption key is configured.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (91 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (91 web tests + 23 extension VS Code tests)

## 2026-07-01 - GitHub Login Payload Validation

- Added a shared `readJsonObjectPayload` helper for route payloads that must be JSON objects.
- Updated both user and admin GitHub-login PATCH routes to reject malformed, array, string, and `null` JSON bodies instead of treating them as empty objects.
- Added tests for valid object parsing and invalid payload shapes.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (94 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (94 web tests + 23 extension VS Code tests)

## 2026-07-01 - Azure Work Item Status Mapping Coverage

- Extracted the Azure DevOps work-item upstream-to-client status mapping into `azureDevOpsWorkItemsClientStatus`.
- Added tests for 401/403/429 passthrough and 400/404/500 mapping to 502.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (96 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (96 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## 2026-07-01 - GitHub Billing Cron Auth Coverage

- Added `isCronAuthorized` and wired GitHub billing sync cron access through the shared bearer-token parser.
- Added tests for missing cron secret, missing auth header, matching bearer token, whitespace/casing, wrong token, malformed auth, and extra bearer token parts.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (99 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (99 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## 2026-07-01 - Auth Failure Hint Coverage

- Expanded `authFailureHint` tests to cover invalid grant, token exchange failure, provider error, and callback failure hints.
- Reached 100 web tests and 123 tests through the root `pnpm test` command.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (100 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (100 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## 2026-07-01 - Health Response Cache Control

- Added a tested `healthResponseInit` helper.
- Updated `/api/health` to send `Cache-Control: no-store` on both ready and unhealthy responses.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (102 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (102 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## 2026-07-01 - Deployment Metadata Docs Alignment

- Added non-secret `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME` placeholders to `apps/web/.env.example`.
- Updated the deployment contract so build metadata is listed with required production runtime variables and health smoke checks require `Cache-Control: no-store`.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (102 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Shared Frontend Response Errors

- Added a shared `readResponseError` / `responseErrorMessage` helper for safe JSON `{ error }` response parsing.
- Reused it in task editing, request session bulk/session mutations, GitHub billing sync, GitHub-login mapping, and WorkItemPicker search errors.
- Added regression coverage for trimmed error strings and fallback behavior for empty/non-string/non-object/non-JSON responses.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (105 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (105 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Extension TrackerClient Response Hardening

- Hardened work-item search response handling so malformed successful payload entries are ignored instead of reaching picker rendering.
- Hardened extension server error parsing so blank JSON/string error bodies fall back to `Copilot Tracker server returned HTTP <status>`.
- Added extension regression tests for both cases.

## Checks

- PASS: `pnpm --filter ./apps/extension test` (25 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (105 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - GitHub Billing Response Normalization

- Extracted pure GitHub billing response row normalization into `githubBillingRows.ts`.
- Hardened GitHub billing sync parsing so malformed `usageItems` are ignored and invalid `timePeriod` values fall back to the requested sync date.
- Added regression coverage for valid row mapping and malformed response tolerance.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (107 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (107 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - GitHub Billing Impossible-Date Guard

- Added UTC calendar validation for GitHub billing response `timePeriod` values.
- Added regression coverage so impossible dates such as February 31 fall back to the requested sync date.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (108 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (108 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Shared Route JSON Payload Parsing

- Added shared `readJsonPayload` and reused it in event ingest, chat request batch ingest, bulk task update, and single task update routes.
- Refactored `readJsonObjectPayload` to use the shared helper.
- Added regression coverage for parsed non-object JSON values and malformed JSON fallback.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (109 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (109 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Auth Failure Alert UX

- Made unauthenticated homepage auth failure/misconfigured notices `role="alert"` with assertive live regions.
- Added destructive visual emphasis and monospace rendering for the stable auth error code.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (109 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Enforce Pnpm Security Overrides

- Moved dependency security overrides from ignored `package.json` fields to `pnpm-workspace.yaml`, which pnpm 11 reads for workspace settings.
- Added a PostCSS override so Next resolves to patched `postcss@8.5.15` instead of the vulnerable nested `8.4.31`.
- Refreshed `pnpm-lock.yaml`; existing `diff` and `serialize-javascript` security pins are now represented in the lockfile overrides block.

## Checks

- PASS: `pnpm audit --prod --audit-level moderate`
- PASS: `pnpm why postcss --prod` reports only `postcss@8.5.15`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (109 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension package`

## 2026-07-01 - Tolerant Successful Mutation Counts

- Added shared `readNumericResponseField` for optional numeric success counters returned by mutation endpoints.
- Reused it in admin GitHub billing sync and request-session mutation success handling.
- Hardened admin billing sync so an empty or malformed successful response falls back to a generic success message instead of surfacing a false sync failure.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (112 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (112 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Work Item Picker Payload Normalization

- Added `workItemsFromSearchPayload` to normalize successful Azure DevOps work-item search payloads for the picker UI.
- Filtered malformed entries and defaulted nullable display fields before rendering search options.
- Replaced the WorkItemPicker raw JSON cast with the shared normalizer.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (114 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (114 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Azure DevOps Work Item Response Hardening

- Hardened successful Azure DevOps work-item JSON parsing so malformed 200 responses map to a typed `azure_devops_bad_response` 502 instead of escaping as untyped failures.
- Added shape guards for WIQL id payloads and batch work-item payloads.
- Filtered invalid upstream work-item ids before batch fetching and tolerated missing result arrays as empty results.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (117 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (117 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Billing Sync Method Authorization

- Added tested `canRunBillingSync` authorization helper.
- Tightened `/api/admin/github-billing/sync` so cron bearer auth can run GET/POST, while signed-in admin fallback is available only for POST.
- Updated README API and cron/manual billing sync instructions.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (120 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (120 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Extension Work Item Id Guard

- Aligned extension TrackerClient work-item result validation with the web/backend Azure DevOps work-item ID range.
- Filtered non-positive and too-large successful work-item search payload IDs before they can reach the quick pick.
- Expanded the extension malformed work-item payload regression test.

## Checks

- PASS: `pnpm --filter ./apps/extension test` (25 tests)
- PASS: `pnpm --filter ./apps/extension typecheck`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (120 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Azure Provider Error Codes

- Preserved sanitized OAuth provider error codes in the Azure callback redirect instead of collapsing every provider error to `provider_error`.
- Kept provider `error_description` out of public redirect params and homepage UI.
- Added fallback behavior for blank/unsafe provider error codes and a safe `access_denied` operator hint.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (122 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Extension Server Error Message Cap

- Reused the extension's existing 240-character server-message cap for JSON `{ error }` response bodies.
- Added regression coverage so oversized backend/proxy JSON errors cannot flood VS Code surfaced errors or structured logs.

## Checks

- PASS: `pnpm --filter ./apps/extension test` (26 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Auth Callback Smoke Docs

- Clarified the deployment smoke contract for provider-error callbacks: preserve sanitized short `auth_code` values, but never reflect provider descriptions into public URLs or page text.

## Checks

- PASS: `git diff --check`

- PASS: GitHub Actions for `625a202 Cap extension server error messages` completed successfully on both CI and Build extension workflows.

## 2026-07-01 - Production Smoke Verifier

- Added `scripts/smoke-production.mjs` and `pnpm smoke:production` to codify production deploy checks for health, build metadata, cache control, Azure OAuth PKCE/scopes, and provider-error callback behavior.
- Added `--allow-known-stale` mode so current production can be monitored without hiding known freshness warnings.
- Updated deployment docs to point operators at the script.

## Checks

- PASS: `node --check scripts/smoke-production.mjs`
- EXPECTED FAIL: `pnpm smoke:production` fails strict mode on current stale production
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 26 extension VS Code tests)

## 2026-07-01 - Production Smoke Verifier Tests

- Added local HTTP-server tests for `scripts/smoke-production.mjs`.
- Covered fresh deploy success, strict stale deploy failure, and `--allow-known-stale` warning behavior.
- Wired `pnpm test:smoke` into the root `pnpm test` command so CI runs the smoke verifier tests without touching production.

## Checks

- PASS: `pnpm test:smoke` (3 tests)
- PASS: `node --check scripts/smoke-production.test.mjs`
- PASS: `git diff --check`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (3 smoke tests + 122 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale`

## 2026-07-01 - Work Item Picker Id Bounds

- Aligned web WorkItemPicker result normalization with backend and extension Azure DevOps work-item ID bounds.
- Filtered non-positive and above-PostgreSQL-int successful result IDs before they can render in task search suggestions.
- Expanded malformed work-item search payload coverage for negative and too-large IDs.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (122 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`

## 2026-07-01 - Health Freshness Headers

- Expanded the shared health response freshness contract from bare `Cache-Control: no-store` to browser/intermediary no-cache headers.
- Reused the same shared header object from `next.config.ts` so Next emits `/api/health` freshness headers even if platform routing handles the response differently.
- Added regression coverage for the expanded health header contract.

## Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (3 smoke tests + 123 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm smoke:production -- --allow-known-stale`
- PASS: `git diff --check`

## 2026-07-01 - Exact Deployment Smoke

- Added `--expect-sha` support to `scripts/smoke-production.mjs` so smoke checks can prove the exact deployed commit once `/api/health` build metadata is configured.
- Kept short/full SHA prefix matching and made known-stale mode warn instead of fail on SHA mismatches.
- Preserved existing `pnpm smoke:production -- ...` usage by accepting the forwarded `--` separator.
- Documented exact-SHA smoke usage in deployment docs.

## Checks

- PASS: `node --check scripts/smoke-production.mjs`
- PASS: `pnpm test:smoke` (7 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (7 smoke tests + 123 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0bc8f68`
- PASS: `git diff --check`

## 2026-07-01 - Redacted Auth Diagnostics

- Added short `auth_ref` values to Azure OAuth failure redirects so browser failures can be matched to server logs without exposing provider details.
- Added structured `azure_oauth_callback_failed` server-side warning events with redacted provider descriptions, callback stages, and state/PKCE presence diagnostics.
- Added homepage rendering for the safe diagnostic reference.
- Added production smoke coverage for provider-error callback `auth_ref` so deployed diagnostics can be checked automatically.
- Documented that detailed auth diagnostics belong in Dokploy/server logs, not public URLs or page text.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (125 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (7 smoke tests + 125 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0d1bab4`
- PASS: `git diff --check`

## 2026-07-01 - Operator Auth Diagnosis Notes

- Recorded that public auth failures should return only safe `auth_code` and `auth_ref` values.
- Recorded that detailed OAuth provider diagnostics belong in redacted Dokploy/server logs and should be correlated by `auth_ref`.
- Verified production log correlation in Dokploy UI and documented the current Azure client-type mismatch diagnosis without recording secrets.

## Checks

- PASS: production `pnpm smoke:production -- --allow-known-stale --expect-sha 615f097` includes provider-error `auth_ref` behavior.
- PASS: real Chrome failure page stays safe while matching Dokploy logs provide the detailed diagnosis.

## 2026-07-01 - Deployment Operator Fix Docs

- Clarified that Dokploy Dockerfile deploys need explicit Build Time Arguments and runtime environment variables for `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME`.
- Clarified that the current Azure OAuth backend flow is a confidential server-side token exchange and therefore expects a web/confidential Entra app registration with a valid client secret.

## Checks

- PASS: `git diff --check`

## 2026-07-01 - Azure Portal Auth Diagnosis

- Used the existing signed-in Chrome profile to inspect Microsoft Entra App registrations.
- Confirmed the Copilot Tracker redirect platform is `Single-page application`, which conflicts with the current backend confidential-client token exchange.
- Confirmed the current signed-in account could inspect but not edit the registration, so the live fix requires an app-registration owner/admin account.

## Checks

- PASS: `7137e29` passed GitHub Actions CI and Build extension.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 7137e29` passed all hard gates with expected build metadata warnings.

## 2026-07-01 - Profile/Org Auth Diagnostics

- Added a detailed Azure DevOps profile/org lookup result path that preserves the existing `fetchAzureDevOpsUser` API while exposing redacted diagnostics to the callback route.
- Added server-side OAuth failure log fields for `profileResult`, `profileStatus`, `orgMembershipResult`, `orgMembershipStatus`, `orgMembershipAccountCount`, and `hasProfileId`.
- Kept the public browser failure unchanged: only safe `auth_code` plus `auth_ref` are shown.
- Documented how to use `auth_ref` to diagnose `profile_or_org_check_failed` in Dokploy logs.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (128 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (7 smoke tests + 128 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha e614348`
- PASS: `git diff --check`
- PASS: `7020999` passed GitHub Actions CI and Build extension after push.
- PASS: `7020999` deployed successfully in Dokploy.
- PASS/WARN: post-deploy `pnpm smoke:production -- --allow-known-stale --expect-sha 7020999`.
- PASS: real Chrome + Dokploy logs verified deployed profile/org diagnostics.

## 2026-07-01 - Azure DevOps Org URL Normalization

- Exported and hardened `normalizeAzureDevOpsOrg` so `AZURE_DEVOPS_ORG` accepts the older `https://<org>.visualstudio.com` organization URL form as well as org slugs and `https://dev.azure.com/<org>`.
- Added direct config tests for all accepted org formats.
- Updated README and deployment docs to document the accepted `AZURE_DEVOPS_ORG` formats.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (131 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (26 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (7 smoke tests + 131 web tests + 26 extension VS Code tests)
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 20094a0`
- PASS: `git diff --check`

## 2026-07-01 - Direct Azure DevOps Org Access Probe

- Added a fallback org validation path after account-name matching fails: the auth flow now probes the configured Azure DevOps org WIQL endpoint with the signed-in access token.
- Kept the fallback fail-closed: only a successful WIQL JSON response with a `workItems` array can satisfy the check.
- Added redacted `orgAccessProbeResult` and `orgAccessProbeStatus` diagnostics to server-side auth logs.
- Added coverage for probe failure diagnostics and probe-based user acceptance when Azure account names do not match the configured org slug.
- Documented the new diagnostic fields in the deployment troubleshooting guide.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (132 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (26 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (7 smoke tests + 132 web tests + 26 extension VS Code tests)
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 9a3acb1`
- PASS: `git diff --check`

## 2026-07-01 - Production Auth Runtime Configuration

- Updated production runtime Azure DevOps org configuration in Dokploy to the user-provided accessible org value; the value is not recorded in repo logs.
- Added production runtime `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` in Dokploy so new web sessions can store encrypted Azure DevOps tokens for work-item search; the value is not recorded in repo logs.
- Redeployed production after the runtime env updates.

## Checks

- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 1506101` passed every hard gate; warnings remain limited to unknown build metadata/SHA.
- PASS: real Chrome fresh logout/login lands on `/dashboard`.
- PASS: signed-in `/api/azure-devops/work-items?query=test` returns HTTP 200 with a valid JSON response and zero matches for that literal query.

## 2026-07-01 - Production Admin Runtime Configuration

- Added the requested login to production `ADMIN_AZURE_DEVOPS_LOGINS` in Dokploy without recording the admin list.
- Preserved existing runtime env, build args, and build secrets while saving the update.
- Redeployed production after the runtime env change.

## Checks

- PASS: fresh real Chrome logout/login shows Admin navigation.
- PASS: direct `/admin` load renders admin content and export links without unauthorized state.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0f9b2b8` passed every hard gate; warnings remain limited to unknown build metadata/SHA.

## 2026-07-01 - VS Code Extension Tracker Session Auth

- Replaced the extension's direct VS Code Microsoft/Azure DevOps token flow with a tracker web sign-in callback flow after real VS Code testing hit Microsoft `AADSTS65002`.
- Added `/api/auth/extension-token` to mint a tracker session token from an existing authenticated web session and return it through the extension URI callback.
- Updated API authentication so extension bearer tokens map to tracker sessions, while legacy direct Azure bearer validation remains as a fallback for direct API clients.
- Updated work-item search to use the server-stored Azure token when the bearer is a tracker session.
- Stored extension auth tokens in VS Code SecretStorage and validated callback state before accepting a token.
- Removed the old extension Azure DevOps auth provider source and cleaned stale build output before VSIX packaging.
- Fixed root VS Code extension-host launch/tasks to target `apps/extension`.
- Updated README/INSTALL/extension README for the new auth model.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web test` (137 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder env
- PASS: `pnpm --filter ./apps/extension test` (29 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension package`; rebuilt VSIX excludes the deleted auth module and was installed in real VS Code.

## 2026-07-01 - VS Code OTel Lifecycle Stability

- Added `SingleFlightTaskQueue` and routed OTel lifecycle rebuilds through it so overlapping configuration-change events coalesce instead of leaking duplicate timers/watchers.
- Tracked the active OTel file path after lifecycle setup; normal polling and syncing now read that path without re-running Copilot settings updates.
- Added a short own-write guard for Copilot OTel configuration-change events produced by the extension's exporter setup.
- Made Copilot OTel configuration logging idempotent: actual setting writes are logged with key names, already-configured checks are debug-only.
- Added a regression test for coalescing overlapping lifecycle rebuild requests.

## Checks

- PASS: real VS Code production sign-in, sync, task assignment, status bar, and dashboard verification.
- PASS: rebuilt VSIX installed into real VS Code; post-reload logs stayed quiet over a longer sample.
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (30 tests)
- PASS: `pnpm -r test --if-present` (137 web tests + 30 extension tests)
- PASS: `pnpm test:smoke` (7 smoke tests)
