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
