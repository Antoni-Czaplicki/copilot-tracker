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
