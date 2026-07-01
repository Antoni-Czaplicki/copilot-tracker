# Nightly QA Deployment

- Production URL: https://copilot-tracker.antek.page
- Latest local commit at start: `8c0d915 Show Azure token exchange errors`
- Latest pushed commit checked locally: `f85f30e Harden Azure OAuth callback failures`
- Deploy status: production is reachable, but deployment had not yet picked up the OAuth privacy fix at 2026-07-01 02:02 CEST
- Notes: never record secret values here.

## 2026-07-01 02:02 CEST Production HTTP Checks

- PASS: homepage returned HTTP 200.
- PASS: `/api/auth/azure-devops` returned a Microsoft redirect with PKCE `code_challenge`, `code_challenge_method=S256`, `state`, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- PASS: `/api/azure-devops/work-items?query=123` returned an auth-gated status.
- FAIL/STALE: provider-error callback still reflected a test `error_description` in the redirect, indicating production was not yet serving `f85f30e`.
- PASS: Chrome verified the unauthenticated homepage renders and the Azure login control is a plain `<a href="/api/auth/azure-devops">` document-navigation link.

## 2026-07-01 02:04 CEST Local Deployment Checks

- PASS: `GET /api/health` under `next start` returned structured readiness JSON and build metadata.
- BLOCKED: Docker build could not run because the Docker daemon socket was unavailable on this machine.

## 2026-07-01 02:13 CEST Production HTTP Checks

- PASS: homepage returned HTTP 200.
- PASS: provider-error callback no longer reflects `error_description`, so production is at least serving OAuth hardening from `f85f30e`.
- STALE/BLOCKED: `/api/health` still returned 404, so production had not deployed `03c390b` or newer. The hard production encryption-key requirement may have blocked startup if the deployment environment lacks `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY`; recovery change is in progress to fail closed for token storage without blocking deployment.

## 2026-07-01 02:32 CEST Production HTTP Checks

- PASS: `GET /api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: homepage returned HTTP 200.
- PASS: `/api/auth/azure-devops` returned a Microsoft redirect with PKCE challenge, `code_challenge_method=S256`, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- PASS: provider-error callback redirects with stable `auth_code=provider_error` and does not reflect `error_description`.
- PASS: `/api/azure-devops/work-items?query=123` returned auth-gated status.
- PASS: `/api/admin/export?type=bogus` returned auth-gated status for unauthenticated request.
- PASS: Chrome verified live homepage title/copy and the login link remains a document-navigation anchor to `/api/auth/azure-devops`.
- LIMITATION: `/api/health` reports `version.sha="unknown"` because the Dokploy/Docker build is not passing `COPILOT_TRACKER_BUILD_SHA`; exact deployed commit cannot be proven from production yet. README now documents the build metadata variables to configure.

## 2026-07-01 02:36 CEST Chrome Auth Flow

- BLOCKED: real Chrome Azure login flow returned to the app home with `auth=failed&auth_code=invalid_client`.
- PASS: failure redirect did not include `auth_description` and did not reflect provider description details.
- Impact: production signed-in dashboard, Azure DevOps work-item search with web session tokens, admin flows, and request editing cannot be verified through the real production account until the external Azure app/client configuration is fixed.

## 2026-07-01 03:25 CEST Deployment Contract

- PASS: added tracked deployment contract in `docs/deployment.md` covering required runtime env names, build metadata, Azure app registration checks, and production smoke commands without recording secret values.
- PASS: `.dockerignore` excludes `.codex` so nightly QA logs are not copied into Docker build contexts.
- PASS: `docker compose config` renders app/Postgres services and build/runtime metadata arguments with local fallbacks.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` until the deploy platform passes `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME`.

## 2026-07-01 03:53 CEST Chrome Production Smoke

- PASS: real Chrome loaded the production homepage at `https://copilot-tracker.antek.page/` with title `Copilot Tracker`.
- PASS: login remains a document-navigation link to `/api/auth/azure-devops`.
- BLOCKED: following the real auth flow still returns to `/?auth=failed&auth_code=invalid_client`.
- PASS: the visible login failure UI shows a stable `invalid_client` code and does not expose provider descriptions or secret values.

## 2026-07-01 03:25 CEST CI/Production Poll

- PASS: GitHub Actions for `da1e800 Validate admin export type before loading data` completed successfully on both CI and extension build workflows.
- PASS: production `/api/health` returned OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"`, so exact deployed commit remains unprovable from the app.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with state, PKCE `S256`, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 03:28 CEST CI Poll

- PASS: GitHub Actions for `1dbdf10 Add admin export coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 03:34 CEST CI Poll

- PASS: GitHub Actions for `e4e49ee Allow IPv6 localhost tracker server` completed successfully on both CI and extension build workflows.

## 2026-07-01 03:38 CEST CI Poll

- PASS: GitHub Actions for `be7beec Support clearing web task assignments` completed successfully on both CI and extension build workflows.

## 2026-07-01 03:41 CEST CI Poll

- PASS: GitHub Actions for `f15b18c Add safe Azure auth failure hints` completed successfully on both CI and extension build workflows.

## 2026-07-01 03:44 CEST Production Auth Hint Poll

- STALE: production `/?auth=failed&auth_code=invalid_client` still showed the stable error code but not the new safe `invalid_client` operator hint, so the auth-hint UI had not deployed yet.
- PASS: production `/?auth=failed&auth_code=unexpected_provider_blob` did not show invented hint copy for an unknown code.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"`, so stale-build detection remains indirect.

## 2026-07-01 03:46 CEST CI Poll

- PASS: GitHub Actions for `0e63df4 Replace extension sample test` completed successfully on both CI and extension build workflows.

## 2026-07-01 03:48 CEST CI Poll

- PASS: GitHub Actions for `eb93d5e Fix homepage task example spacing` completed successfully on both CI and extension build workflows.

## 2026-07-01 03:52 CEST Local Build Command Check

- PASS: updated README full-build command with production-safe placeholder env values.
- PASS: ran the documented `pnpm build` command successfully.
