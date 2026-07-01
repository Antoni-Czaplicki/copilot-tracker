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

## 2026-07-01 06:16 CEST Deployment Contract Follow-Up

- PASS: GitHub Actions for `2456c3e Prevent health response caching` completed successfully on both CI and extension build workflows.
- LOCAL: `.env.example` now lists non-secret build metadata placeholders.
- LOCAL: deployment smoke docs now expect `/api/health` to send `Cache-Control: no-store`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header as of the loop start poll; recheck after the docs/env commit deploys.

## 2026-07-01 06:17 CEST Production Poll

- PUSHED: `69a50f6 Align deployment metadata docs`.
- IN PROGRESS: GitHub Actions for `69a50f6` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:20 CEST CI Poll

- PASS: GitHub Actions for `69a50f6 Align deployment metadata docs` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:22 CEST Production Poll

- PUSHED: `fc5ccd1 Share frontend response error handling`.
- IN PROGRESS: GitHub Actions for `fc5ccd1` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:24 CEST CI Poll

- PASS: GitHub Actions for `fc5ccd1 Share frontend response error handling` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:26 CEST Production Poll

- PUSHED: `bab82eb Harden extension tracker responses`.
- IN PROGRESS: GitHub Actions for `bab82eb` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:29 CEST CI Poll

- PASS: GitHub Actions for `bab82eb Harden extension tracker responses` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:31 CEST Production Poll

- PUSHED: `36b506e Harden GitHub billing response parsing`.
- IN PROGRESS: GitHub Actions for `36b506e` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:33 CEST Chrome Production Smoke

- PASS: real Chrome loaded the production homepage with title `Copilot Tracker`.
- PASS: real Chrome confirmed visible login anchors use document navigation to `/api/auth/azure-devops`.
- BLOCKED/EXPECTED: real Chrome auth navigation still returns `/?auth=failed&auth_code=invalid_client`.
- PASS: rendered failure page contains stable `invalid_client` guidance and does not expose provider `AADSTS`, `error_description`, or secret values.

## 2026-07-01 06:34 CEST CI Poll

- PASS: GitHub Actions for `36b506e Harden GitHub billing response parsing` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:37 CEST Production Poll

- PUSHED: `8256b76 Reject impossible GitHub billing dates`.
- IN PROGRESS: GitHub Actions for `8256b76` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:42 CEST Production Poll

- PASS: GitHub Actions for `8256b76 Reject impossible GitHub billing dates` completed successfully on both CI and extension build workflows.
- PUSHED: `72438f5 Share route JSON payload parsing`.
- IN PROGRESS: GitHub Actions for `72438f5` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:44 CEST CI Poll

- PASS: GitHub Actions for `72438f5 Share route JSON payload parsing` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:46 CEST Production Poll

- PUSHED: `a12045b Improve auth failure alert UX`.
- IN PROGRESS: GitHub Actions for `a12045b` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

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

## 2026-07-01 13:23 CEST Extension Lifecycle Commit Poll

- PUSHED: `ae3d4e4 Stabilize extension OTel lifecycle`.
- PASS: `origin/main` points at `ae3d4e465e46e85211e6a8465999ca66d76fc23e`.
- PASS: GitHub Actions `CI` completed successfully for `ae3d4e4`.
- PASS: GitHub Actions `Build extension` completed successfully for `ae3d4e4`.
- PASS/WARN: live production smoke passed all hard gates with `pnpm smoke:production -- --allow-known-stale --expect-sha ae3d4e4`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`, so exact deployed commit proof still depends on configuring build metadata in Dokploy/build env.

## 2026-07-01 13:35 CEST Build Metadata Fallback Ready

- LOCAL: Docker builds first generated `apps/web/build-info.json`; Dokploy logs confirmed that step ran, but strict production smoke still reported unknown metadata after deploy.
- UPDATED: Docker builds now generate `apps/web/src/generated/buildInfo.generated.ts` before `next build` so the server bundle can report the deployed commit even when runtime file reads are unavailable.
- LOCAL: `/api/health` uses the generated module after explicit runtime env and common env fallbacks, preserving env override precedence. The generated-file fallback remains as a compatibility fallback.
- LOCAL: `.dockerignore` includes only minimal Git metadata for SHA resolution, and Dockerfile removes `.git` before final image copy.
- PASS: production-style Next build passed without the previous broad Turbopack tracing warning.
- PASS: `docker compose config` passed.
- BLOCKED: full Docker image build could not be run locally because Docker cannot connect to the local daemon socket.
- EXPECTED: production will continue to warn on unknown SHA/build time until this change is pushed and Dokploy builds a new image.

## 2026-07-01 13:57 CEST Exact SHA Smoke Passed

- PUSHED: `23e4df9 Compile Docker build metadata`.
- PASS: GitHub Actions `CI` and `Build extension` completed successfully for `23e4df9`.
- PASS: Dokploy deployment for `23e4df9` completed successfully.
- PASS: Dokploy build logs showed `apps/web/src/generated/buildInfo.generated.ts` was written before `next build` with the expected commit prefix and build time.
- PASS: strict `pnpm smoke:production -- --expect-sha 23e4df9` passed without `--allow-known-stale`.
- PASS: production `/api/health` now reports the exact deployed SHA `23e4df9d0ca6018a04bafee3d1cff9f7b3c0c3cb` and a non-unknown build time.

## 2026-07-01 14:06 CEST Log Commit CI And Deploy Lag

- PUSHED: `f90a5b0 Record exact deploy proof verification`.
- PASS: GitHub Actions `CI` and `Build extension` completed successfully for `f90a5b0`.
- PASS/WARN: strict production smoke against `f90a5b0` failed only the expected SHA check because production still served the previous verified `23e4df9` build; health, database, auth redirect, PKCE, scopes, provider-error handling, and cache headers still passed.
- NEXT: the next code-bearing deploy should supersede this log-only lag and be verified by strict production smoke.

## 2026-07-01 14:22 CEST Work-Item Search Deploy Verified

- PUSHED: `6477f9c Improve Azure DevOps work-item search`.
- PASS: GitHub Actions `CI` and `Build extension` completed successfully for `6477f9c`.
- PASS: Dokploy deployment log showed `apps/web/src/generated/buildInfo.generated.ts` was written with the `6477f9c` SHA before `next build`, and the Docker build completed.
- WARN/FIXED OPERATIONALLY: after the deployment was marked done, production still reported `23e4df9`; using Dokploy app `Reload` switched production to `6477f9c`.
- PASS: strict `pnpm smoke:production -- --expect-sha 6477f9c` passed after Reload.
- PASS: live dashboard picker verification passed for deployed numeric and text empty states.

## 2026-07-01 14:42 CEST Picker Keyboard Coverage Deploy Verified

- PUSHED: `d19e76c Cover work-item picker keyboard movement`.
- PASS: GitHub Actions `CI` and `Build extension` completed successfully for `d19e76c`.
- PASS: Dokploy deployment completed and built the expected image.
- WARN/FIXED OPERATIONALLY: after the deployment was marked done, production still reported `6477f9c`; using Dokploy app `Reload` switched production to `d19e76c`.
- PASS: strict `pnpm smoke:production -- --expect-sha d19e76c` passed after Reload.

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

## 2026-07-01 05:37 CEST Production Poll

- PUSHED: `db1bd63 Harden task history resolution`.
- IN PROGRESS: GitHub Actions for `db1bd63` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:38 CEST CI and Extension Package Poll

- PASS: GitHub Actions for `db1bd63 Harden task history resolution` completed successfully on both CI and extension build workflows.
- PASS: `pnpm --filter ./apps/extension package` produced a VSIX successfully.
- NOTE: package command emitted an existing warning that the extension package lacks a LICENSE file.
- CLEANUP: removed the generated `copilot-tracker-0.0.1.vsix` artifact from the worktree.

## 2026-07-01 05:40 CEST Extension Package License Poll

- PASS: added package-local `apps/extension/LICENSE`.
- PASS: `pnpm --filter ./apps/extension package` produced a VSIX containing `LICENSE.txt`.
- PASS: previous `vsce` missing-license warning is gone.
- CLEANUP: removed the generated `copilot-tracker-0.0.1.vsix` artifact from the worktree.

## 2026-07-01 05:41 CEST Production Poll

- PUSHED: `ef40fc3 Add extension package license`.
- IN PROGRESS: GitHub Actions for `ef40fc3` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:45 CEST CI Poll

- PASS: GitHub Actions for `ef40fc3 Add extension package license` completed successfully on both CI and extension build workflows.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"` until deploy build metadata is configured.

## 2026-07-01 05:49 CEST Production Poll

- PUSHED: `c944583 Add Azure session token coverage`.
- IN PROGRESS: GitHub Actions for `c944583` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:52 CEST CI Poll

- PASS: GitHub Actions for `c944583 Add Azure session token coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:54 CEST Production Poll

- PUSHED: `5b06f76 Harden session token crypto`.
- IN PROGRESS: GitHub Actions for `5b06f76` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 05:56 CEST CI Poll

- PASS: GitHub Actions for `5b06f76 Harden session token crypto` completed successfully on both CI and extension build workflows.

## 2026-07-01 05:58 CEST Production Poll

- PUSHED: `2906354 Validate GitHub login JSON payloads`.
- IN PROGRESS: GitHub Actions for `2906354` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:00 CEST CI Poll

- PASS: GitHub Actions for `2906354 Validate GitHub login JSON payloads` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:01 CEST Production Poll

- PUSHED: `5447dd0 Add work item status mapping coverage`.
- IN PROGRESS: GitHub Actions for `5447dd0` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:03 CEST CI Poll

- PASS: GitHub Actions for `5447dd0 Add work item status mapping coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:05 CEST Production Poll

- PUSHED: `5a921fe Add cron auth coverage`.
- IN PROGRESS: GitHub Actions for `5a921fe` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:07 CEST CI Poll

- PASS: GitHub Actions for `5a921fe Add cron auth coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:08 CEST Production Poll

- PUSHED: `93df1e2 Expand auth failure hint coverage`.
- IN PROGRESS: GitHub Actions for `93df1e2` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:10 CEST CI Poll

- PASS: GitHub Actions for `93df1e2 Expand auth failure hint coverage` completed successfully on both CI and extension build workflows.

## 2026-07-01 06:12 CEST Production Poll

- PUSHED: `2456c3e Prevent health response caching`.
- IN PROGRESS: GitHub Actions for `2456c3e` started after push.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"` and `builtAt="unknown"` and did not yet include `Cache-Control: no-store`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.

## 2026-07-01 06:50 CEST CI/Release Poll

- PASS: GitHub Actions for `a12045b Improve auth failure alert UX` completed successfully on both CI and Build extension workflows.
- PASS: local VSIX packaging still succeeds after lockfile changes; package includes README, changelog, license, package manifest, and compiled `out/` files.
- PASS: production dependency audit now reports no known moderate-or-higher vulnerabilities after moving pnpm security overrides to `pnpm-workspace.yaml`.
- PUSHED: `f76379a Enforce pnpm security overrides`.
- PASS: GitHub Actions for `f76379a` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: production `/api/health` freshness and exact deployed commit remain unproven until production exposes build metadata and the expected no-store header.

## 2026-07-01 06:58 CEST Production Poll

- PUSHED: `2b69124 Harden successful mutation counts`.
- PASS: GitHub Actions for `2b69124` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:03 CEST Production Poll

- PUSHED: `f2ab551 Normalize work item picker results`.
- PASS: GitHub Actions for `f2ab551` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:08 CEST Production Poll

- PUSHED: `de00e83 Harden Azure work item responses`.
- PASS: GitHub Actions for `de00e83` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:13 CEST Production Poll

- PUSHED: `784ef08 Restrict billing sync GET to cron`.
- PASS: GitHub Actions for `784ef08` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:18 CEST Production Poll

- PUSHED: `294cf69 Guard extension work item ids`.
- PASS: GitHub Actions for `294cf69` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, client id, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:22 CEST Chrome Smoke

- PASS: production homepage loads in Chrome with title `Copilot Tracker`.
- PASS: Chrome sees two visible `/api/auth/azure-devops` login links labelled `Log in with Azure DevOps`.
- PASS: Chrome auth route reaches `/?auth=failed&auth_code=invalid_client`.
- PASS: visible auth failure copy gives safe invalid-client guidance and does not expose provider description/secrets.
- STALE/LIMITATION: Chrome DOM has no `role="alert"` node on the auth failure page, so the latest auth alert semantics are not visibly deployed.

## 2026-07-01 07:31 CEST Production Poll

- PUSHED: `4538973 Preserve Azure provider auth codes`.
- IN PROGRESS: GitHub Actions for `4538973` started on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: provider-error callback still redirects with `auth_code=provider_error`, so the new provider-code behavior is not live yet.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:34 CEST Production Poll

- PASS: GitHub Actions for `4538973 Preserve Azure provider auth codes` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: direct provider-error callback still redirects with `auth_code=provider_error`; deployed frontend/backend freshness remains unproven.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:38 CEST Production Poll

- PUSHED: `27e58c3 Guard web work item ids`.
- PASS: GitHub Actions for `27e58c3` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: direct provider-error callback still redirects with `auth_code=provider_error`; deployed freshness remains unproven.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:41 CEST Production Poll

- PUSHED: `625a202 Cap extension server error messages`.
- PASS: GitHub Actions for `625a202` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: direct provider-error callback still redirects with `auth_code=provider_error`; deployed freshness remains unproven.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:44 CEST Production Poll

- PUSHED: `29cf02d Clarify auth callback smoke docs`.
- PASS: GitHub Actions for `29cf02d` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: direct provider-error callback still redirects with `auth_code=provider_error`; deployed freshness remains unproven.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 07:59 CEST Production Poll

- PASS: GitHub Actions for `22d34f0 Record final nightly QA status` completed successfully on both CI and Build extension workflows.
- PASS: production `/api/health` returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirect includes state, PKCE `S256`, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- STALE/LIMITATION: direct provider-error callback still redirects with `auth_code=provider_error`; deployed freshness remains unproven.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.

## 2026-07-01 08:06 CEST Production Poll

- PASS: GitHub Actions for `cf5ade1 Correct final nightly QA poll logs` completed successfully on both CI and Build extension workflows.
- ADDED: `pnpm smoke:production` codifies the production smoke contract.
- EXPECTED FAIL: strict `pnpm smoke:production` fails current production because build metadata/cache header/provider-code freshness are still stale.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale` exits successfully while warning on those freshness gaps.

## 2026-07-01 08:14 CEST Production Poll

- PASS: GitHub Actions for `1384cfe Add production smoke verifier` completed successfully on both CI and Build extension workflows.
- ADDED: smoke verifier tests now run locally and in root `pnpm test`, so verifier behavior is covered without production network dependency.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale` still reports the known production freshness warnings.

## 2026-07-01 08:23 CEST Production Poll

- SOURCE FIX READY: `/api/health` now shares expanded browser/intermediary freshness headers between the route response helper and Next route header configuration.
- PASS: local placeholder-env web production build accepts the `/api/health` header configuration.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale` still reaches production successfully.
- STALE/LIMITATION: production currently still reports `sha="unknown"`, `builtAt="unknown"`, missing visible `Cache-Control`, and stale provider-error callback code until the deployment proves freshness.

## 2026-07-01 08:27 CEST Production Poll

- PUSHED: `ea2685e Harden health freshness headers`.
- PASS: GitHub Actions CI and Build extension workflows completed successfully for `ea2685e`.
- PASS/WARN: post-CI `pnpm smoke:production -- --allow-known-stale` passed against https://copilot-tracker.antek.page.
- STALE/LIMITATION: production still reports unknown build metadata, missing visible health `Cache-Control`, and stale provider-error callback `auth_code=provider_error`.

## 2026-07-01 08:58 CEST Production Poll

- User reports the VPS/Dokploy issue was fixed.
- PASS: latest pushed commit `0bc8f68 Record health header QA poll` completed successfully on both GitHub Actions workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production `/api/health` now sends `Cache-Control: no-store, no-cache, max-age=0, must-revalidate` plus CDN/proxy freshness headers.
- PASS: direct provider-error callback redirects to `/?auth=failed&auth_code=access_denied` and clears OAuth cookies.
- PASS: production auth failure HTML includes `role="alert"` and safe `invalid_client` copy without matching `AADSTS`, `error_description`, or `client_secret`.
- LIMITATION: strict `pnpm smoke:production` still fails because `/api/health` reports `sha="unknown"` and `builtAt="unknown"`.
- ADDED: `pnpm smoke:production -- --expect-sha "$(git rev-parse --short HEAD)"` can now prove exact deployed SHA once metadata is configured.

## 2026-07-01 09:04 CEST Production Poll

- PUSHED: `d948d06 Verify deployed commit in production smoke`.
- PASS: GitHub Actions CI and Build extension workflows completed successfully for `d948d06`.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha d948d06` passed against production.
- LIMITATION: production smoke warnings are now limited to unknown build metadata and expected-SHA mismatch caused by `version.sha="unknown"`.

## 2026-07-01 09:07 CEST Chrome Production Auth Retry

- PASS: `7d88d23 Record exact smoke QA poll` completed successfully on GitHub Actions CI and Build extension workflows.
- FAIL/BLOCKED: real Chrome retry of the visible Azure DevOps login link still redirects back to `/?auth=failed&auth_code=invalid_client`.
- PASS: the production auth failure page remains safe after the real retry: one alert region, retry links present, and no provider-description leakage detected.
- NEXT: inspect/fix production Azure OAuth client configuration in Dokploy/Termius, then rerun Chrome signed-in dashboard/Azure work-item E2E.

## 2026-07-01 09:14 CEST Auth Diagnostics Prep

- No Dokploy MCP tool is exposed in this Codex session; use Chrome for Dokploy UI/log inspection and Termius/SSH for VPS-level fixes.
- ADDED: Azure OAuth callback failures now emit redacted structured `azure_oauth_callback_failed` warning events with `authRef`, stage, stable code, and safe diagnostic fields.
- ADDED: public failure redirects now include only safe `auth_code` plus `auth_ref`; provider `error_description`, tokens, cookies, code verifiers, and secrets stay out of browser URLs/page text.
- NEXT AFTER DEPLOY: reproduce the Chrome `invalid_client` flow, copy the public `auth_ref`, and find the matching JSON line in Dokploy logs.

## 2026-07-01 09:19 CEST Auth Ref Smoke Prep

- PASS: `0d1bab4 Add redacted auth diagnostics` completed successfully on GitHub Actions CI and Build extension workflows.
- ADDED: production smoke now checks that provider-error callbacks include diagnostic `auth_ref`.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0d1bab4` passes but warns that production still lacks `auth_ref` until the diagnostics deployment is live.

## 2026-07-01 09:26 CEST Auth Diagnostics Verification

- PASS: `615f097 Check auth references in production smoke` completed successfully on GitHub Actions CI and Build extension workflows.
- PASS: `pnpm smoke:production -- --allow-known-stale --expect-sha 615f097` passes against production; the provider-error callback now includes a short diagnostic `auth_ref`.
- PASS: real Chrome Azure login retry still returns the known safe failure URL/page with `auth_code=invalid_client` plus an `auth_ref`; no provider descriptions, tokens, cookies, code verifiers, or secret values are exposed in the browser.
- PASS: Dokploy logs contain a matching redacted `azure_oauth_callback_failed` event for the browser `auth_ref`, proving the client reference can be used for operator-side diagnosis.
- DIAGNOSIS: the server-side log reports Azure `AADSTS700025`: the client is treated as public, so the backend should not present a client secret. Current app code is built for a confidential server-side token exchange, so fix the Azure app registration/client type or deliberately change the auth config/code to a public-client PKCE flow.
- LIMITATION: no Dokploy MCP tool is exposed in this Codex session. Use Chrome for the Dokploy UI/logs, and if the VPS/Dokploy host itself needs fixing, use Termius/SSH without printing credentials.
- LIMITATION: exact deployed commit proof still waits on build metadata; production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`.

## 2026-07-01 09:36 CEST Azure Portal Diagnosis

- PASS: `7137e29 Clarify Dokploy and Azure auth setup` completed successfully on GitHub Actions CI and Build extension workflows.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 7137e29` passed all hard production gates; warnings remain limited to unknown build metadata/SHA.
- CONFIRMED: Microsoft Entra App registrations is reachable in the existing Chrome profile and the Copilot Tracker app registration can be inspected.
- ROOT CAUSE: Authentication configuration shows the callback redirect under `Single-page application`, not `Web`. That matches Dokploy's `AADSTS700025` token-exchange failure because Azure treats the callback as public-client while the backend sends `AZURE_DEVOPS_CLIENT_SECRET`.
- BLOCKED: live edit controls for redirect URI/platform are disabled in the current signed-in context, and the account is not listed as an owner of the registration. Use an account/role with app registration edit rights, move/add the production callback redirect URI under `Web`, then rerun the Chrome login.

## 2026-07-01 10:23 CEST Azure Web Redirect Retest

- PASS: user-provided Azure Portal screenshot shows the production callback redirect URI now under `Web`.
- PASS: `pnpm smoke:production -- --allow-known-stale --expect-sha e614348` still passes all hard gates; warnings remain limited to unknown build metadata/SHA.
- PASS/PROGRESS: real Chrome production login no longer returns `auth_code=invalid_client`; the confidential Web app redirect/token exchange issue is cleared.
- FAIL/NEXT: real Chrome production login now returns `auth_code=profile_or_org_check_failed` with a safe `auth_ref`.
- LOCAL FIX IN PROGRESS: callback logging now includes redacted profile/org diagnostic fields for this stage, without logging tokens, profile payloads, org names, or secrets.

## 2026-07-01 10:32 CEST Profile/Org Diagnostics Deploy Verification

- PASS: `7020999 Add profile org auth diagnostics` completed successfully on GitHub Actions CI and Build extension workflows.
- PASS: Dokploy deployments list shows `7020999` deployed successfully.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 7020999` passed all hard gates; warnings remain limited to unknown build metadata/SHA.
- PASS: real Chrome production login still returns a safe public `auth_code=profile_or_org_check_failed` plus `auth_ref`, with no provider details in the URL.
- PASS: matching Dokploy log event now includes redacted profile/org diagnostics.
- DIAGNOSIS: `profileResult=ok`, `profileStatus=200`, `hasProfileId=true`, `orgMembershipResult=not_matched`, `orgMembershipStatus=200`, and `orgMembershipAccountCount=1`. The remaining production auth issue is configured organization membership matching, not token exchange or profile lookup.

## 2026-07-01 10:38 CEST Org URL Normalization Prep

- PASS: fresh real Chrome production auth retry still reaches `profile_or_org_check_failed`, proving the Azure Web redirect fix remains effective but org matching is still the active blocker in the deployed build.
- PASS: matching Dokploy log for the fresh `auth_ref` confirms profile lookup OK/status 200/profile id present and org membership OK/status 200 with one account returned but no configured-org match.
- LOCAL CHANGE: source now normalizes old-style `https://<org>.visualstudio.com` `AZURE_DEVOPS_ORG` values before membership matching and work-item URL generation.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 20094a0` passed all hard gates; warnings remain limited to unknown build metadata/SHA.
- NEXT: deploy this change and retry real Chrome login. If still blocked, inspect/update the production `AZURE_DEVOPS_ORG` value or user organization membership/visibility.

## 2026-07-01 10:53 CEST Org Probe Prep

- PASS: `9a3acb1 Normalize Azure DevOps org URLs` completed GitHub Actions CI and Build extension.
- PASS: Dokploy deployments list shows `9a3acb1` done.
- PASS/WARN: post-deploy `pnpm smoke:production -- --allow-known-stale --expect-sha 9a3acb1` passed all hard gates; warnings remain limited to unknown build metadata/SHA.
- FAIL/NEXT: real Chrome production login still returns `auth_code=profile_or_org_check_failed`; the user-provided matching log still shows profile OK/status 200, account count 1, and org membership not matched.
- LOCAL CHANGE: source now adds a direct configured Azure DevOps org WIQL probe after account-list matching fails, with redacted probe result/status diagnostics.
- NEXT: deploy the probe and retry Chrome login. If login still fails, use the new `orgAccessProbeResult`/`orgAccessProbeStatus` log fields to distinguish configured-org access failure from account-list naming mismatch.

## 2026-07-01 11:04 CEST Org Probe Deploy Verification

- PASS: `01650a4 Probe configured Azure DevOps org access` completed GitHub Actions CI and Build extension.
- PASS: Dokploy deployments list shows `01650a4` done.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 01650a4` passed all hard gates; warnings remain limited to unknown build metadata/SHA.
- FAIL/NEXT: real Chrome production login still returns `auth_code=profile_or_org_check_failed`.
- PASS: matching Dokploy log includes deployed probe diagnostics: profile OK/status 200, profile id present, account-list OK/status 200 with one account, account-list org not matched, and configured-org WIQL probe HTTP 401.
- DIAGNOSIS: production OAuth/profile code is working; remaining blocker is configured Azure DevOps org access for the signed-in user/token. Fix `AZURE_DEVOPS_ORG`, user org membership/visibility, or work-item consent/access for that org.

## 2026-07-01 11:36 CEST Production Auth Fix Verification

- PASS: production runtime Azure DevOps org configuration was corrected in Dokploy using the user-provided accessible org value. The value is intentionally not recorded here.
- PASS: production runtime `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` is present in Dokploy so fresh web sessions can persist encrypted Azure DevOps tokens. The value is intentionally not recorded here.
- PASS: Dokploy redeployed latest `main` commit `1506101 Record configured org access diagnosis` after the runtime env changes.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 1506101` passed every hard gate: health OK, database ready, health `Cache-Control: no-store`, Azure auth redirect to Microsoft, PKCE `S256`, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- WARN: `/api/health` still reports `version.sha="unknown"` and `version.builtAt="unknown"`, so exact deployed commit proof remains blocked until build metadata is configured.
- PASS: real Chrome fresh logout/login lands on `https://copilot-tracker.antek.page/dashboard`.
- PASS: signed-in `/api/azure-devops/work-items?query=test` returns HTTP 200 with a valid JSON response and zero matches for that literal query.

## 2026-07-01 12:19 CEST Production Admin Runtime Config

- PASS: production `ADMIN_AZURE_DEVOPS_LOGINS` was updated in Dokploy to include the requested login. The admin list is intentionally not recorded here.
- PASS: existing runtime env, build args, and build secrets were preserved while saving the admin update.
- PASS: Dokploy deploy trigger returned OK and application status reported `done`.
- PASS: fresh real Chrome logout/login shows Admin navigation for the requested login.
- PASS: direct `https://copilot-tracker.antek.page/admin` loads admin content and export links without unauthorized state.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0f9b2b8` passed every hard gate after the admin redeploy; warnings remain limited to unknown build metadata/SHA.

## 2026-07-01 12:39 CEST Extension Token Auth Pending Deploy

- LOCAL: implemented `/api/auth/extension-token` and extension URI callback auth after real VS Code exposed Microsoft `AADSTS65002` on the old direct Azure DevOps scope request.
- LOCAL: placeholder-env web build lists `/api/auth/extension-token` as a dynamic route.
- LOCAL: rebuilt VSIX excludes stale `azureDevOpsAuth.js` and installed into real VS Code.
- NOT YET DEPLOYED: new route and extension-token API behavior are pending commit/push and Dokploy deployment.
- NEXT VERIFY AFTER DEPLOY: production rejects unsafe extension callbacks with HTTP 400; authenticated extension sign-in redirects back to VS Code; extension sync uploads the OTel fixture and production dashboard shows the session.

## 2026-07-01 13:17 CEST Real VS Code Production Usage

- DEPLOYED: extension-token route from `311bd56` is live enough for real VS Code sign-in and production sync.
- PASS: real VS Code sign-in through production tracker web callback completed and stored a tracker session token without exposing token material.
- PASS: real VS Code OTel fixture synced to production and production dashboard reload showed task `124`, one request, `gpt-5-nano`, 321 input, 123 output, and 444 total tokens.
- LOCAL FIX PENDING DEPLOY: OTel lifecycle stability fix is implemented and verified in a locally installed VSIX. It must still be committed, pushed, and deployed/packaged from the repo.
- PASS: local validation passed after the fix: typecheck, lint, placeholder-env web build, extension compile/test, workspace tests, and smoke tests.
- REMAINING: `/api/health` still reports unknown build metadata/SHA, so exact deployed commit proof remains blocked until Dokploy build metadata is configured.
