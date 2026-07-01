# Nightly QA Handoff

## Current Summary

Nightly QA started at 2026-07-01 01:50:33 CEST. Baseline inspection, subagent review, extension hardening, OAuth callback hardening, deployment health/secret-contract work, API boundary validation, request grid task editing UX, token-storage deployment recovery, leaderboard privacy gating, token integer bounds, Drizzle migration env contract, batch ingest response semantics, extension partial-token cost display, extension workspace task isolation, admin billing sync UX, branch-task docs/copy alignment, compose app-service modeling, extension log/context privacy hardening, the first web/domain test harness, extension OTel unchanged-upload skipping, Azure DevOps WIQL query hardening, deployment contract documentation, WorkItemPicker debounce UX polish, extension event user privacy, extension server URL validation, admin export validation-order hardening, admin export pure test coverage, extension IPv6 localhost support, web task-clearing support, safe Azure auth failure hints, extension placeholder test replacement, homepage copy spacing polish, README task/API docs alignment, README build-command validation, root test coverage alignment, dashboard focused-session pagination preservation, auth cookie/PKCE helper coverage, Azure OAuth route failure coverage, Azure token exchange coverage, Azure DevOps work-item search coverage, extension TrackerClient coverage, health build metadata normalization, auth identity/bearer parsing coverage, Azure profile/org lookup robustness, Azure token response robustness, payload schema coverage, analytics/dashboard grouping coverage, GitHub billing date parser coverage, extension current-session token stats coverage, extension pricing parity, WorkItemPicker helper coverage, chat request merge/dedupe/token-normalization coverage, request session grid model coverage, extension status formatting coverage, GitHub username mapping feedback, extension dashboard URL coverage, and extension task-history resolution coverage are complete locally. Local compile/test/lint/typecheck/web build checks have passed for these slices.

## Remaining Risks

- Full browser/VS Code E2E testing not started yet.
- Web/API/auth automated tests are still thin but no longer absent; the new web test harness covers payload schemas including chat request defaults/bounds and tracker events, chat request merge/dedupe/token normalization, request session grid model behavior, analytics/dashboard grouping, GitHub billing date parsing, WorkItemPicker helpers, GitHub username mapping feedback, cost estimation, GitHub login normalization, auth callback code sanitization and hints, auth cookie policy, disabled-auth identity, bearer parsing, Azure profile/org lookup parsing, PKCE generation, OAuth start/callback failure routes, Azure token exchange request/error/malformed response behavior, Azure DevOps WIQL/search behavior, and admin CSV export helpers.
- Extension OTel sync still parses the full file, but unchanged request records are no longer reposted unless stable metadata, workspace, or target server changes. Extension client tests now cover work-item auth options, remote no-token blocking, HTTP error messages, network retry failures, current-session token aggregation, newer pricing aliases, status bar token/cost formatting, dashboard deep-link URL construction, and task-history attribution.
- Production smoke passed at 2026-07-01 02:32 CEST: homepage, health, database readiness, Azure PKCE redirect/scopes, provider-error privacy, work-items auth gate, admin export auth gate, and Chrome homepage/login-link check all passed.
- Production Azure login is blocked: real Chrome auth flow returned `auth_code=invalid_client` at 2026-07-01 02:36 CEST.
- Exact deployed commit is still not provable because `/api/health` reports `version.sha="unknown"`; README and `docs/deployment.md` now document passing `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME` from Dokploy/build configuration, and the app now treats blank/`unknown` metadata as absent before trying common source metadata fallbacks.
- Docker image build could not run because the Docker daemon was unavailable.

## Latest Local Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension test` (23 tests)
- PASS: `pnpm --filter @copilot-tracker/web test` (81 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 23 extension tests)

## Next Steps

1. Configure Dokploy build metadata so `/api/health` reports the deployed commit SHA.
2. Continue converting high-risk findings into tests and small fixes.
3. Run deeper Chrome/VS Code signed-in E2E flows after Azure client configuration is fixed.
4. Keep production smoke polling while commits deploy.
