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
