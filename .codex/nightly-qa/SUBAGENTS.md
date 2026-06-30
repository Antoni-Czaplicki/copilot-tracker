# Nightly QA Subagents

## Spawned at 2026-07-01 01:50 CEST

1. `019f1af1-8b56-7792-bf72-dcc2a915ee8a` / Bohr - Extension QA/UX explorer.
   - Scope: `apps/extension`, activation/auth/backend URL/session/Copilot capture/token split/cost/status bar/task search/offline/multi-workspace/restart behavior.
2. `019f1af1-a414-74a2-a75d-86b2867bd893` / Faraday - Web QA/UX explorer.
   - Scope: `apps/web`, homepage/auth/dashboard/session grouping/bulk editing/task search/admin/leaderboard/export/mobile/empty/loading/error/permissions.
3. `019f1af1-b633-73d1-8996-a6e7d63c4fa7` / Russell - Azure DevOps auth/PKCE/API explorer.
   - Scope: OAuth routes, cookies, redirects, scopes, provider errors, token exchange, callback validation, work-item API.
4. `019f1af1-d86d-7ef2-8d99-6111d0e8ef84` / Plato - Backend/data model/API validation explorer.
   - Scope: API routes, persistence, request ingest, sessions, bulk update, token split, unauthorized/malformed behavior.
5. `019f1af1-f278-7b32-bcab-01674c3a2131` / Schrodinger - Deployment/Dokploy readiness explorer.
   - Scope: Docker/config/scripts/env docs/production verification and stale-build risks.
6. `019f1af2-0cbb-7a60-a6da-9fb06f3baf20` / Boyle - Security/privacy/secrets explorer.
   - Scope: tracked files, docs, API responses/logging, auth/session, extension storage, secret/org/admin leakage, telemetry privacy.

## Deferred

- Test strategy/regression coverage explorer was initially deferred due to the thread limit, then spawned after closing completed scouts:
  - `019f1af4-3c27-7332-ab1e-d05fb920f540` / Beauvoir - Test strategy/regression coverage explorer.

## Results

### Bohr - Extension QA/UX

- [P1] Quick Pick search can race after picker closes in `apps/extension/src/extension.ts`; async `searchWorkItems` may mutate disposed picker.
- [P1] Branch-task extraction is too permissive in `apps/extension/src/workspaceContext.ts`; any first digit sequence can become a task ID.
- [P2] `openDashboard` can throw on malformed `serverUrl` instead of showing a friendly error.
- [P2] Multi-workspace context can remain stale until the next poll after active editor switches.
- [P2] Cost display appears exact when token capture is partial or missing.
- [P2] Sync reparses/resends the full OTel file each cycle; dedupe may hide correctness while preserving workload risk.
- [P3] Legacy global selected-task fallback can leak a stale manual override into new workspaces.
- Coverage gap: extension tests are concentrated on OTel parsing and branch helper behavior; missing tests for client/network/auth/search/status/multi-root/restart behavior.

### Plato - Backend/Data Model/API Validation

- [P1] Malformed JSON can crash authenticated GitHub login PATCH routes instead of returning a structured 400.
- [P2] Billing sync date query is forwarded without validation, causing opaque upstream failures for malformed dates.
- [P2] Token payload schema allows unbounded non-negative integers while DB columns are PostgreSQL `integer`, so large counts can overflow writes.
- [P2] Batch ingest returns `accepted` as received request count even when dedupe/conflicts reduce actual persisted updates.
- [P3] Admin export `type` query is trusted as-is and used in output filename/header.
- Coverage gap: no web API/domain tests found; suggested route tests for malformed JSON, duplicate ingest accounting, invalid billing date, export type validation, token overflow, and retry/rate-limit behavior.

### Schrodinger - Deployment/Dokploy Readiness

- [P1] No concrete Dokploy deployment config or deploy workflow is tracked in the repo.
- [P1] `apps/web/drizzle.config.ts` falls back to a localhost database URL, which can hide missing production `DATABASE_URL` during migrations.
- [P1] CI lacks a web production build step, so deploy-breaking Next build failures may pass CI.
- [P2] `docker-compose.yml` only defines Postgres; there is no app service or local app/DB startup model.
- [P2] README references `apps/web/.env.example`, but that file is missing.
- [P2] No health/readiness endpoint for deployment checks or stale-build detection.
- Suggested improvements: add `/api/health`, Docker healthcheck/build metadata, web build in CI, env example/docs, stricter migration env contract, and app service compose/Dokploy docs.

### Faraday - Web QA/UX

- [P1] Single-row task edit is implemented underneath but unreachable in dashboard/admin UI; `TaskEditor` is not used.
- [P2] Bulk/session assignment applies optimistic success UI after any 2xx, ignoring backend `updated` count.
- [P2] Admin GitHub billing sync is a state-changing GET navigated as a link, with no in-page loading/error/success state.
- [P3] Export endpoint accepts unknown `type` values and silently falls back to full request export.
- [P3] Request sessions grid lacks a horizontal overflow wrapper, so mobile can clip long columns.
- [P3] OAuth callback rethrows unexpected token exchange errors instead of returning the auth-failure UI.
- Coverage gap: no web test suite found for dashboard task editing, bulk assignment, admin sync UX, export validation, API boundaries, or mobile table rendering.

### Beauvoir - Test Strategy/Regression Coverage

- Confirmed current automated coverage is extension-only; web/API/auth/deployment have no dedicated test suite.
- Produced a 110+ case test matrix covering extension, API/backend, auth, web UI, and deployment; main agent imported it into `TEST_CASES.md`.
- Top automation priorities: API integration harness for events/chat requests, auth route/callback tests, store upsert/dedupe/token source matrix, Azure token refresh tests, work-item endpoint status mapping, admin export CSV validation, RequestSessionsGrid/WorkItemPicker component tests, Playwright smoke for auth-gated pages, compose startup smoke, and CI web test/build stage.

### Boyle - Security/Privacy/Secrets

- [P1] Leaderboard is available to any signed-in user and renders public leaderboard data including developer login mappings.
- [P2] OAuth provider error details are copied into `auth_description` and rendered on the public home page, which can leak diagnostics through history/referrers/screenshots.
- [P1] Session-token encryption falls back to `AZURE_DEVOPS_CLIENT_SECRET` when `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` is missing, coupling OAuth secret rotation with token storage secrecy.
- [P3] Extension info/warn logs and context UI include raw repo paths, remote URLs, workspace storage paths, and session stats; reduce durable metadata at info level.
- Confirmed `.dockerignore` excludes `.env` files from the build context.

### Russell - Azure DevOps Auth/PKCE/API

- [P1] OAuth callback only guards token exchange; profile lookup or session creation failures can 500 and leave PKCE/state cookies alive.
- [P2] Provider `error` and `error_description` are echoed into landing URLs and rendered publicly.
- [P2] Azure token encryption fallback to client secret can break work-item access on secret rotation or replica mismatch; prefer dedicated stable encryption key in production.
- Coverage gap: no web auth tests for login redirect, PKCE/state cookies, invalid state, provider error, token exchange failure, profile/org failure, or work-item status mapping.
- Production checks: verify `NEXT_PUBLIC_APP_URL` is exact public HTTPS origin, cookies are `HttpOnly; SameSite=Lax; Secure`, and Azure callback URL matches `/api/auth/callback/azure-devops`.
