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

## 2026-07-01 03:54 CEST CI Poll

- PASS: GitHub Actions for `6991f4a Align README task and API docs` completed successfully on both CI and extension build workflows.

## 2026-07-01 03:55 CEST CI Poll

- PASS: GitHub Actions for `c4a3e1c Fix README build command` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:04 CEST CI Poll

- PASS: GitHub Actions for `c67f8fa Preserve dashboard session focus in pagination` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:09 CEST CI Poll

- PASS: GitHub Actions for `b1d5098 Add auth cookie and PKCE coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:14 CEST CI Poll

- PASS: GitHub Actions for `96d1148 Add Azure OAuth route coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:19 CEST CI Poll

- PASS: GitHub Actions for `0a093ad Add Azure token exchange coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:26 CEST CI Poll

- PASS: GitHub Actions for `15d76ee Add Azure work item search coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:31 CEST Build Metadata Follow-Up

- PASS: GitHub Actions for `96bab47 Add extension TrackerClient coverage` completed successfully on both CI and extension build workflows.
- LOCAL: `/api/health` build metadata lookup now treats blank/`unknown` values as absent and can use common source commit/time variables when available.
- LIMITATION: production still needs explicit build metadata env/build args to prove exact deployed commit from `/api/health`.

## 2026-07-01 04:33 CEST Production Poll

- PUSHED: `16d5c67 Normalize health build metadata`.
- IN PROGRESS: GitHub Actions for `16d5c67` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:35 CEST CI Poll

- PASS: GitHub Actions for `16d5c67 Normalize health build metadata` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:36 CEST Production Poll

- PUSHED: `80a3c2b Harden auth bearer parsing`.
- IN PROGRESS: GitHub Actions for `80a3c2b` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:38 CEST CI Poll

- PASS: GitHub Actions for `80a3c2b Harden auth bearer parsing` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:41 CEST Production Poll

- PUSHED: `d8473d2 Harden Azure profile parsing`.
- IN PROGRESS: GitHub Actions for `d8473d2` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:42 CEST CI Poll

- PASS: GitHub Actions for `d8473d2 Harden Azure profile parsing` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:43 CEST Production Poll

- PUSHED: `97ce2f9 Harden Azure token responses`.
- IN PROGRESS: GitHub Actions for `97ce2f9` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:45 CEST CI Poll

- PASS: GitHub Actions for `97ce2f9 Harden Azure token responses` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:47 CEST Production Poll

- PUSHED: `7871f09 Expand payload schema coverage`.
- IN PROGRESS: GitHub Actions for `7871f09` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:49 CEST CI Poll

- PASS: GitHub Actions for `7871f09 Expand payload schema coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:50 CEST Production Poll

- PUSHED: `6a28203 Add analytics coverage`.
- IN PROGRESS: GitHub Actions for `6a28203` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:52 CEST CI Poll

- PASS: GitHub Actions for `6a28203 Add analytics coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:53 CEST Production Poll

- PUSHED: `b78a488 Add billing date coverage`.
- IN PROGRESS: GitHub Actions for `b78a488` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:55 CEST CI Poll

- PASS: GitHub Actions for `b78a488 Add billing date coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 04:57 CEST Production Poll

- PUSHED: `0ccdab6 Add extension session stats coverage`.
- IN PROGRESS: GitHub Actions for `0ccdab6` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 04:59 CEST Chrome Production Smoke

- PASS: real Chrome loaded `https://copilot-tracker.antek.page/` with title `Copilot Tracker`.
- PASS: Chrome DOM check found login links pointing to `/api/auth/azure-devops`.
- PASS: navigating through production Azure auth returned to `/?auth=failed&auth_code=invalid_client`.
- PASS: provider `error_description` was not visible in the production URL or body text.
- STALE/LIMITATION: the newer `invalid_client` safe operator hint was still not visible in Chrome production, reinforcing that deployed frontend freshness cannot be proven until build metadata is configured.

## 2026-07-01 05:01 CEST CI Poll

- PASS: GitHub Actions for `0ccdab6 Add extension session stats coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:02 CEST Production Poll

- PUSHED: `b4907ae Sync extension pricing aliases`.
- IN PROGRESS: GitHub Actions for `b4907ae` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:03 CEST CI Poll

- PASS: GitHub Actions for `b4907ae Sync extension pricing aliases` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:05 CEST Production Poll

- PUSHED: `91fb8d3 Add work item picker coverage`.
- IN PROGRESS: GitHub Actions for `91fb8d3` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:10 CEST CI Poll

- PASS: GitHub Actions for `91fb8d3 Add work item picker coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:10 CEST Production Poll

- PUSHED: `4e96bf2 Add chat request merge coverage`.
- IN PROGRESS: GitHub Actions for `4e96bf2` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:15 CEST CI Poll

- PASS: GitHub Actions for `4e96bf2 Add chat request merge coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:16 CEST Production Poll

- PUSHED: `12eb414 Add request session grid coverage`.
- IN PROGRESS: GitHub Actions for `12eb414` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:19 CEST CI Poll

- PASS: GitHub Actions for `12eb414 Add request session grid coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:20 CEST Production Poll

- PUSHED: `80f9933 Add extension status formatting coverage`.
- IN PROGRESS: GitHub Actions for `80f9933` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:22 CEST CI Poll

- PASS: GitHub Actions for `80f9933 Add extension status formatting coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:24 CEST Production Poll

- PUSHED: `21a41f5 Improve GitHub username error feedback`.
- IN PROGRESS: GitHub Actions for `21a41f5` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:26 CEST CI Poll

- PASS: GitHub Actions for `21a41f5 Improve GitHub username error feedback` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:27 CEST Production Poll

- PUSHED: `88b55a0 Add extension dashboard URL coverage`.
- IN PROGRESS: GitHub Actions for `88b55a0` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:31 CEST CI Poll

- PASS: GitHub Actions for `88b55a0 Add extension dashboard URL coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:32 CEST Production Poll

- PUSHED: `439b174 Add extension task history coverage`.
- IN PROGRESS: GitHub Actions for `439b174` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:34 CEST CI and Chrome Poll

- PASS: GitHub Actions for `439b174 Add extension task history coverage` completed successfully on both CI and extension build workflows.
- PASS: real Chrome loaded production homepage with title `Copilot Tracker`.
- PASS: production homepage exposes `/api/auth/azure-devops` login links.
- PASS: real Chrome auth navigation returns safely to `/?auth=failed&auth_code=invalid_client`.
- PASS: provider `error_description` is not visible in Chrome URL/body text.
- PASS: production now renders the safe `invalid_client` hint about Azure app registration.
- LIMITATION: exact deployed commit is still not provable because health metadata remains `unknown`.
