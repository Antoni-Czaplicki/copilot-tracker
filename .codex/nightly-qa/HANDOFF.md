# Nightly QA Handoff

## Current Summary

Nightly QA started at 2026-07-01 01:50:33 CEST. Baseline inspection, subagent review, extension hardening, OAuth callback hardening, deployment health/secret-contract work, API boundary validation, request grid task editing UX, token-storage deployment recovery, leaderboard privacy gating, token integer bounds, Drizzle migration env contract, batch ingest response semantics, extension partial-token cost display, extension workspace task isolation, admin billing sync UX, branch-task docs/copy alignment, compose app-service modeling, extension log/context privacy hardening, the first web/domain test harness, extension OTel unchanged-upload skipping, Azure DevOps WIQL query hardening, deployment contract documentation, and WorkItemPicker debounce UX polish are complete locally. Local compile/test/lint/typecheck/web build checks have passed for these slices.

## Remaining Risks

- Full browser/VS Code E2E testing not started yet.
- Web/API/auth automated tests are still thin but no longer absent; the new web test harness covers payload schemas, cost estimation, GitHub login normalization, and auth callback code sanitization.
- Extension OTel sync still parses the full file, but unchanged request records are no longer reposted unless stable metadata, workspace, or target server changes.
- Production smoke passed at 2026-07-01 02:32 CEST: homepage, health, database readiness, Azure PKCE redirect/scopes, provider-error privacy, work-items auth gate, admin export auth gate, and Chrome homepage/login-link check all passed.
- Production Azure login is blocked: real Chrome auth flow returned `auth_code=invalid_client` at 2026-07-01 02:36 CEST.
- Exact deployed commit is still not provable because `/api/health` reports `version.sha="unknown"`; README and `docs/deployment.md` now document passing `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME` from Dokploy/build configuration.
- Docker image build could not run because the Docker daemon was unavailable.

## Latest Local Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm --filter @copilot-tracker/web test`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## Next Steps

1. Configure Dokploy build metadata so `/api/health` reports the deployed commit SHA.
2. Continue converting high-risk findings into tests and small fixes.
3. Run deeper Chrome/VS Code signed-in E2E flows after Azure client configuration is fixed.
4. Keep production smoke polling while commits deploy.
