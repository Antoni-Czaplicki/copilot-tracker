# Nightly QA Handoff

## Current Summary

Nightly QA started at 2026-07-01 01:50:33 CEST. Baseline inspection, subagent review, extension hardening, OAuth callback hardening, deployment health/secret-contract work, API boundary validation, request grid task editing UX, token-storage deployment recovery, leaderboard privacy gating, token integer bounds, Drizzle migration env contract, batch ingest response semantics, extension partial-token cost display, extension workspace task isolation, and admin billing sync UX are complete locally. Local compile/test/lint/typecheck/web build checks have passed for these slices.

## Remaining Risks

- Full browser/VS Code E2E testing not started yet.
- Web/API/auth automated tests are still missing.
- Production smoke passed at 2026-07-01 02:32 CEST: homepage, health, database readiness, Azure PKCE redirect/scopes, provider-error privacy, work-items auth gate, admin export auth gate, and Chrome homepage/login-link check all passed.
- Exact deployed commit is still not provable because `/api/health` reports `version.sha="unknown"`; Dokploy should pass `COPILOT_TRACKER_BUILD_SHA` as a build/runtime variable.
- Docker image build could not run because the Docker daemon was unavailable.

## Latest Local Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## Next Steps

1. Commit/push admin billing sync UX.
2. Configure Dokploy build metadata so `/api/health` reports the deployed commit SHA.
3. Continue converting high-risk findings into tests and small fixes.
4. Run deeper Chrome/VS Code E2E flows after production freshness is proven.
