# Nightly QA Findings

## Extension

1. [FIXED in `39568ea`] Quick Pick search can race after picker closes in `apps/extension/src/extension.ts`; async search may mutate disposed picker.
2. [FIXED in `39568ea`] Branch-task extraction is too permissive in `apps/extension/src/workspaceContext.ts`; branch names like `detached-abc123` can become task `123`.
3. [FIXED in `39568ea`] `openDashboard` can throw on malformed `serverUrl` instead of showing a friendly error.
4. [FIXED in `39568ea`] Multi-workspace context can stay stale until polling after active editor changes.
5. [FIXED in `053541f`] Cost display looks exact even when token capture is partial or missing.
6. [PARTIAL] OTel sync still reparses full files, but unchanged request records are no longer resent across syncs/restarts unless stable metadata changes.
7. [FIXED in `815ae6f`] Legacy global selected-task fallback can leak stale manual overrides across workspaces.
8. [P2] Missing extension tests for client network failures, auth flow, search picker race, multi-root context, partial token cost UI, and restart sync behavior.
9. [FIXED] OTel upload cache must be scoped by tracker server so switching server URL uploads unchanged historical records to the new destination.
10. [FIXED] Extension server URL validation accepted path segments that are silently ignored by absolute API/dashboard URL construction.
11. [FIXED] Extension rejected IPv6 localhost server URLs such as `http://[::1]:3737` even though they are local dev origins.
12. [FIXED] Extension test suite still contained the default placeholder sample test.

## Web UX

1. [FIXED in `392f9ca`] Single-row task edit is implemented but unreachable in dashboard/admin UI.
2. [FIXED in `392f9ca`] Bulk/session assignment applies success UI after any 2xx and ignores backend `updated` count.
3. [FIXED in `fd45703`] Admin GitHub billing sync mutates state via navigated GET without in-page loading/error/success UX.
4. [FIXED in `392f9ca`] Request sessions grid can overflow on mobile without a horizontal scroll wrapper.
5. [FIXED in `f85f30e`] OAuth callback rethrows unexpected exchange errors instead of routing to the auth-failure UI.
6. [PARTIAL] Web test suite now covers lib/domain helpers; component, route, and browser fixture tests are still missing.
7. [FIXED] WorkItemPicker can show stale results or a premature "No matches" state during debounce after the query changes.
8. [FIXED] Web task assignment UI/API could set tasks but could not clear manual assignments back to branch default/no task.
9. [FIXED] Homepage task-detection copy rendered `feature/124-loginall map` without a space.
10. [FIXED] README did not mention clearing task assignments and omitted newer task/search/mapping API routes.

## API / Backend

1. [FIXED in `32a4cfd`] Malformed JSON can crash authenticated GitHub login PATCH routes instead of returning structured 400.
2. [FIXED in `32a4cfd`] Billing sync accepts malformed date query values and can surface opaque upstream errors.
3. [FIXED in `93dd101`] Token payload schema allows values larger than PostgreSQL `integer` columns can persist.
4. [FIXED in `4bab582`] Batch ingest `accepted` count reports received requests, not deduped or persisted rows.
5. [FIXED in `32a4cfd`] Admin export `type` query should be enum-validated.
6. [PARTIAL] Web API/domain tests now cover payload schemas and utility domains; route/DB integration tests are still missing.
7. [FIXED] Azure DevOps work-item WIQL generation accepted unsafe numeric strings and non-finite limits.
8. [FIXED] Admin export validates unsupported export type before loading the full database.
9. [FIXED] Admin export CSV/type helpers had no pure tests for type parsing, quoting, placeholder filtering, or billing export rows.

## Deployment

1. [PARTIAL] No tracked Dokploy manifest/workflow, but a deployment contract now documents required env, build metadata, Azure app settings, and smoke checks.
2. [FIXED in `44ed412`] Drizzle config falls back to localhost `DATABASE_URL`, which can mask production migration misconfiguration.
3. [FIXED in `03c390b`] CI lacks `pnpm --filter @copilot-tracker/web build`.
4. [FIXED in `f6346a9`] Local compose only starts Postgres; app service/health/restart behavior is not modeled.
5. [FIXED in `03c390b`] README references missing `apps/web/.env.example`.
6. [FIXED in `03c390b` and documented in `2ea2641`] No health/readiness endpoint or build SHA exposure for deployed stale-build detection.

## Auth / Security / Privacy

0. [P1] Production Azure login returns `auth_code=invalid_client`, blocking full signed-in production E2E verification.
1. [FIXED in `f85f30e`] OAuth callback can 500 after token exchange if profile lookup/session creation throws, leaving OAuth cookies until expiry.
2. [FIXED in `f85f30e`] OAuth provider error details are reflected into public redirect URLs and homepage UI.
3. [FIXED in `a85225d`] Azure token encryption falls back to `AZURE_DEVOPS_CLIENT_SECRET`; app now avoids the client-secret fallback and does not persist session tokens when the dedicated key is missing.
4. [FIXED in `91d2a7a`] Leaderboard exposes all signed-in developers' leaderboard and login mapping data to any signed-in user.
5. [FIXED in `d260639`] Extension info logs and context UI include raw local paths, remote URLs, and storage paths.
6. [PARTIAL] Web auth tests now cover callback code sanitization; PKCE/state cookies, callback route branches, session creation, profile/org checks, and work-item status mapping still need route/integration coverage.
7. [FIXED] Extension tracker events sent local OS username even though the backend already stamps authenticated user identity.
8. [FIXED] Login failure UI showed stable OAuth codes but did not give safe, actionable hints for common Azure failures such as `invalid_client`.
