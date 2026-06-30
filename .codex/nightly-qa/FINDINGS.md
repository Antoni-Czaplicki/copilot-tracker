# Nightly QA Findings

## Extension

1. [P1] Quick Pick search can race after picker closes in `apps/extension/src/extension.ts`; async search may mutate disposed picker.
2. [P1] Branch-task extraction is too permissive in `apps/extension/src/workspaceContext.ts`; branch names like `detached-abc123` can become task `123`.
3. [P2] `openDashboard` can throw on malformed `serverUrl` instead of showing a friendly error.
4. [P2] Multi-workspace context can stay stale until polling after active editor changes.
5. [P2] Cost display looks exact even when token capture is partial or missing.
6. [P2] OTel sync reparses/resends full files on each cycle/restart.
7. [P3] Legacy global selected-task fallback can leak stale manual overrides across workspaces.
8. [P2] Missing extension tests for client network failures, auth flow, search picker race, multi-root context, partial token cost UI, and restart sync behavior.

## Web UX

1. [P1] Single-row task edit is implemented but unreachable in dashboard/admin UI.
2. [P2] Bulk/session assignment applies success UI after any 2xx and ignores backend `updated` count.
3. [P2] Admin GitHub billing sync mutates state via navigated GET without in-page loading/error/success UX.
4. [P3] Request sessions grid can overflow on mobile without a horizontal scroll wrapper.
5. [P3] OAuth callback rethrows unexpected exchange errors instead of routing to the auth-failure UI.
6. [P2] Web test suite is missing.

## API / Backend

1. [P1] Malformed JSON can crash authenticated GitHub login PATCH routes instead of returning structured 400.
2. [P2] Billing sync accepts malformed date query values and can surface opaque upstream errors.
3. [P2] Token payload schema allows values larger than PostgreSQL `integer` columns can persist.
4. [P2] Batch ingest `accepted` count reports received requests, not deduped or persisted rows.
5. [P3] Admin export `type` query should be enum-validated.
6. [P2] Web API/domain tests are missing.

## Deployment

1. [P1] No tracked Dokploy deployment manifest/workflow or production deploy contract.
2. [P1] Drizzle config falls back to localhost `DATABASE_URL`, which can mask production migration misconfiguration.
3. [P1] CI lacks `pnpm --filter @copilot-tracker/web build`.
4. [P2] Local compose only starts Postgres; app service/health/restart behavior is not modeled.
5. [P2] README references missing `apps/web/.env.example`.
6. [P2] No health/readiness endpoint or build SHA exposure for deployed stale-build detection.

## Auth / Security / Privacy

1. [P1] OAuth callback can 500 after token exchange if profile lookup/session creation throws, leaving OAuth cookies until expiry.
2. [P2] OAuth provider error details are reflected into public redirect URLs and homepage UI.
3. [P1] Azure token encryption falls back to `AZURE_DEVOPS_CLIENT_SECRET`; production should require a dedicated stable encryption key.
4. [P1] Leaderboard exposes all signed-in developers' leaderboard and login mapping data to any signed-in user.
5. [P3] Extension info logs and context UI include raw local paths, remote URLs, and storage paths.
6. [P2] No web auth tests cover PKCE/state cookies, callback failures, session creation, profile/org checks, or work-item status mapping.
