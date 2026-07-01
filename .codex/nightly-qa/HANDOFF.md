# Nightly QA Handoff

## Current Summary

Nightly QA started at 2026-07-01 01:50:33 CEST. Baseline inspection, subagent review, extension hardening, OAuth callback hardening, deployment health/secret-contract work, API boundary validation, request grid task editing UX, token-storage deployment recovery, leaderboard privacy gating, token integer bounds, Drizzle migration env contract, batch ingest response semantics, extension partial-token cost display, extension workspace task isolation, admin billing sync UX, branch-task docs/copy alignment, compose app-service modeling, extension log/context privacy hardening, the first web/domain test harness, extension OTel unchanged-upload skipping, Azure DevOps WIQL query hardening, deployment contract documentation, WorkItemPicker debounce UX polish, extension event user privacy, extension server URL validation, admin export validation-order hardening, admin export pure test coverage, extension IPv6 localhost support, web task-clearing support, safe Azure auth failure hints, extension placeholder test replacement, homepage copy spacing polish, README task/API docs alignment, README build-command validation, root test coverage alignment, dashboard focused-session pagination preservation, auth cookie/PKCE helper coverage, Azure OAuth route failure coverage, Azure token exchange coverage, Azure DevOps work-item search coverage, extension TrackerClient coverage, health build metadata normalization, auth identity/bearer parsing coverage, Azure profile/org lookup robustness, Azure token response robustness, payload schema coverage, analytics/dashboard grouping coverage, GitHub billing date parser coverage, extension current-session token stats coverage, extension pricing parity, WorkItemPicker helper coverage, chat request merge/dedupe/token-normalization coverage, request session grid model coverage, extension status formatting coverage, GitHub username mapping feedback, extension dashboard URL coverage, extension task-history resolution coverage, extension package license polish, Azure session-token helper coverage, session-token crypto hardening, GitHub-login payload validation, Azure work-item status mapping coverage, GitHub billing cron auth coverage, auth failure hint coverage, health response cache control, deployment metadata docs alignment, shared frontend response-error handling, extension TrackerClient malformed-response hardening, GitHub billing response normalization, GitHub billing impossible-date guarding, shared route JSON payload parsing, and auth failure alert UX polish are complete locally. Local compile/test/lint/typecheck/web build/package checks have passed for these slices.

## Remaining Risks

- Full signed-in browser/VS Code E2E testing remains blocked by production Azure `invalid_client`; unauthenticated Chrome smoke, production redirect checks, and VS Code extension test-host runs have been exercised repeatedly.
- Web/API/auth automated tests are still thin but no longer absent; the new web test harness covers payload schemas including chat request defaults/bounds and tracker events, chat request merge/dedupe/token normalization, request session grid model behavior, analytics/dashboard grouping, GitHub billing date parsing and cron auth, WorkItemPicker helpers, GitHub username mapping feedback, GitHub-login JSON object parsing, cost estimation, GitHub login normalization, auth callback code sanitization and hints, auth cookie policy, disabled-auth identity, bearer parsing, Azure profile/org lookup parsing, Azure session-token parsing/expiry behavior, stored session-token crypto behavior, PKCE generation, OAuth start/callback failure routes, Azure token exchange request/error/malformed response behavior, Azure DevOps WIQL/search/status behavior, and admin CSV export helpers.
- Extension OTel sync still parses the full file, but unchanged request records are no longer reposted unless stable metadata, workspace, or target server changes. Extension client tests now cover work-item auth options, remote no-token blocking, HTTP error messages, network retry failures, current-session token aggregation, newer pricing aliases, status bar token/cost formatting, dashboard deep-link URL construction, and task-history attribution including unsorted history input.
- Production smoke passed at 2026-07-01 02:32 CEST: homepage, health, database readiness, Azure PKCE redirect/scopes, provider-error privacy, work-items auth gate, admin export auth gate, and Chrome homepage/login-link check all passed.
- Production Azure login is blocked: real Chrome auth flow returned `auth_code=invalid_client` at 2026-07-01 02:36 CEST and again at 2026-07-01 06:33 CEST. The rendered failure page shows safe generic guidance without provider-description leakage.
- Exact deployed commit is still not provable because `/api/health` reports `version.sha="unknown"`; README and `docs/deployment.md` now document passing `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME` from Dokploy/build configuration, and the app now treats blank/`unknown` metadata as absent before trying common source metadata fallbacks.
- Docker image build could not run because the Docker daemon was unavailable.

## Latest Local Checks

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension test` (26 tests)
- PASS: `pnpm --filter @copilot-tracker/web test` (122 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (122 web tests + 26 extension tests)
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension package` (VSIX produced with `LICENSE.txt` and removed)
- PASS: `pnpm audit --prod --audit-level moderate`
- PASS: `pnpm why postcss --prod` reports one patched `postcss@8.5.15`

## Next Steps

1. Configure Dokploy build metadata so `/api/health` reports the deployed commit SHA.
2. Continue converting high-risk findings into tests and small fixes.
3. Run deeper Chrome/VS Code signed-in E2E flows after Azure client configuration is fixed.
4. Keep production smoke polling while commits deploy.

## 2026-07-01 06:50 CEST Update

- Latest pushed commit before this update, `a12045b Improve auth failure alert UX`, passed both GitHub Actions workflows.
- Found and fixed a production dependency audit issue: Next was resolving vulnerable `postcss@8.4.31`; pnpm security overrides now live in `pnpm-workspace.yaml`, and the lockfile resolves to patched `postcss@8.5.15`.
- Latest checks also include PASS `pnpm audit --prod --audit-level moderate` and PASS `pnpm why postcss --prod` with one PostCSS version.
- This dependency override fix was committed and pushed as `f76379a Enforce pnpm security overrides`; GitHub Actions were in progress at the latest poll.

## 2026-07-01 06:56 CEST Update

- `f76379a Enforce pnpm security overrides` passed both GitHub Actions workflows.
- Added shared successful-response count parsing for web mutations and reused it in admin billing sync plus request-session mutation handling.
- Web tests are now 112; latest broad validation passed typecheck, lint, root tests, web build, and extension compile.
- The successful-response count parsing fix was committed and pushed as `2b69124 Harden successful mutation counts`; GitHub Actions were in progress at the latest poll.

## 2026-07-01 07:01 CEST Update

- `2b69124 Harden successful mutation counts` passed both GitHub Actions workflows.
- Added WorkItemPicker successful search payload normalization and malformed-entry filtering.
- Web tests are now 114; latest broad validation passed typecheck, lint, root tests, web build, and extension compile.
- The WorkItemPicker payload normalization fix was committed and pushed as `f2ab551 Normalize work item picker results`; GitHub Actions were queued/in progress at the latest poll.

## 2026-07-01 07:06 CEST Update

- `f2ab551 Normalize work item picker results` passed both GitHub Actions workflows.
- Hardened Azure DevOps work-item upstream successful response parsing and malformed JSON handling.
- Web tests are now 117; latest broad validation passed typecheck, lint, root tests, web build, and extension compile.
- The Azure DevOps upstream response hardening fix was committed and pushed as `de00e83 Harden Azure work item responses`; GitHub Actions were in progress at the latest poll.

## 2026-07-01 07:11 CEST Update

- `de00e83 Harden Azure work item responses` passed both GitHub Actions workflows.
- Tightened GitHub billing sync so cron bearer auth can use GET/POST, while admin/manual browser sync is POST-only.
- Web tests are now 120; latest broad validation passed typecheck, lint, root tests, web build, and extension compile.
- The billing sync method authorization fix was committed and pushed as `784ef08 Restrict billing sync GET to cron`; GitHub Actions were in progress at the latest poll.

## 2026-07-01 07:16 CEST Update

- `784ef08 Restrict billing sync GET to cron` passed both GitHub Actions workflows.
- Aligned extension work-item result ID validation with web/backend Azure DevOps ID bounds.
- Latest broad validation passed typecheck, lint, root tests, web build, and extension compile.
- The extension work-item ID guard was committed and pushed as `294cf69 Guard extension work item ids`; GitHub Actions were in progress at the latest poll.

## 2026-07-01 07:22 CEST Update

- `294cf69 Guard extension work item ids` passed both GitHub Actions workflows.
- Chrome production smoke passed homepage/login-link checks and safe `invalid_client` auth failure copy checks.
- Chrome production smoke still showed no `role="alert"` node on the auth failure page, so production freshness remains unproven alongside unknown health build metadata and missing visible health no-store header.

## 2026-07-01 07:34 CEST Update

- `4538973 Preserve Azure provider auth codes` passed both GitHub Actions workflows.
- Production still returns `auth_code=provider_error` for a direct provider-error callback, so the provider-code preservation change has not visibly deployed yet.
- Added and validated web WorkItemPicker ID-bound parity with backend/extension filtering; next action is commit/push.

## 2026-07-01 07:38 CEST Update

- `27e58c3 Guard web work item ids` passed both GitHub Actions workflows.
- Added and validated extension JSON server-error message capping; extension tests are now 26.
- Production health remains green, but provider-error callback behavior is still stale and build metadata remains unknown.

## 2026-07-01 07:41 CEST Update

- `625a202 Cap extension server error messages` passed both GitHub Actions workflows.
- Clarified deployment smoke docs for sanitized provider `auth_code` preservation and hidden provider descriptions.
- Production health remains green; provider-error callback behavior still appears stale and `/api/health` still cannot identify the deployed commit.

## 2026-07-01 07:44 CEST Final Update

- `29cf02d Clarify auth callback smoke docs` passed both GitHub Actions workflows.
- Final production smoke: `/api/health` is HTTP 200 with `ok=true` and `database.ok=true`; `/api/auth/azure-devops` redirects to Microsoft with PKCE `S256`, state, and required scopes.
- Remaining production freshness risk: `/api/health` still reports `sha="unknown"`/`builtAt="unknown"` with no visible `Cache-Control` header, and direct provider-error callback still returns `auth_code=provider_error`.
- Documented test cases now reach `DOC-278`.

## 2026-07-01 07:59 CEST Final Poll

- `22d34f0 Record final nightly QA status` passed both GitHub Actions workflows.
- Production health and Azure auth-start redirect checks still pass.
- Remaining risks are unchanged: production build metadata/cache header are still not visible, provider-error callback behavior still appears stale, and signed-in production Azure E2E remains blocked by `invalid_client`.

## 2026-07-01 08:06 CEST Continuation Update

- `cf5ade1 Correct final nightly QA poll logs` passed both GitHub Actions workflows.
- Added `pnpm smoke:production` plus `--allow-known-stale` mode to make deploy freshness checks repeatable.
- Strict smoke mode currently fails production as expected because metadata/cache/provider-code freshness remain stale; known-stale mode passes with warnings.

## 2026-07-01 08:14 CEST Continuation Update

- `1384cfe Add production smoke verifier` passed both GitHub Actions workflows.
- Added local tests for `pnpm smoke:production` and wired them into root `pnpm test`.
- Latest root validation passed 3 smoke tests, 122 web tests, and 26 extension tests.

## 2026-07-01 08:23 CEST Continuation Update

- Added source-side `/api/health` freshness hardening: shared no-store/no-cache headers now cover route responses and Next route header configuration.
- Latest broad validation passed typecheck, lint, root tests, placeholder-env web build, extension compile, live known-stale production smoke, and diff check.
- Root tests now cover 3 smoke verifier tests, 123 web tests, and 26 extension tests.
- Remaining risks are unchanged until deploy freshness is proven: production health metadata/cache headers still look stale, provider-error callback still returns `provider_error`, and signed-in Azure E2E is blocked by `invalid_client`.

## 2026-07-01 08:27 CEST Final Poll Update

- `ea2685e Harden health freshness headers` passed both GitHub Actions workflows.
- Post-CI production smoke still passes in known-stale mode and still warns on unknown build metadata, missing visible health cache header, and stale provider-error callback behavior.
- Best next step: inspect Dokploy/build env and deployment routing/cache behavior, then rerun strict `pnpm smoke:production` once metadata/cache/provider-code freshness are expected to be live.

## 2026-07-01 08:58 CEST VPS Recovery / Exact Smoke Update

- User fixed the VPS/Dokploy issue. If this kind of production/VPS failure recurs, open the Termius app, use the saved SSH/Dokploy access there, and fix the deployment host directly without printing credentials in logs.
- Production now shows the source-side freshness fixes live: health no-store headers are visible, provider-error callback preserves `auth_code=access_denied`, and auth failure HTML includes `role="alert"`.
- Remaining production proof gap: `/api/health` still reports `sha="unknown"` and `builtAt="unknown"`.
- Added `--expect-sha` to production smoke so the next metadata fix can be verified with `pnpm smoke:production -- --expect-sha "$(git rev-parse --short HEAD)"`.
- Broad validation passed after the verifier change: typecheck, lint, root tests, placeholder-env web build, extension compile, production known-stale exact-SHA smoke, and diff check.

## 2026-07-01 09:04 CEST Exact Smoke Poll

- `d948d06 Verify deployed commit in production smoke` passed both GitHub Actions workflows.
- Post-CI production smoke with `--expect-sha d948d06` passes in known-stale mode; only build metadata/SHA checks warn because production still reports `version.sha="unknown"` and `builtAt="unknown"`.
- Next high-value pass: use Chrome's existing session to verify signed-in production dashboard/Azure work-item flows, then set Dokploy/runtime build metadata and rerun strict exact-SHA smoke.

## 2026-07-01 09:14 CEST Auth Diagnostics Update

- Chrome production auth retry still returns `auth_code=invalid_client`; failure UI remains safe.
- Added redacted server-side Azure OAuth diagnostic logging plus public `auth_ref` correlation for matching browser failures to Dokploy logs.
- No Dokploy MCP is exposed here; use Chrome for Dokploy UI/log inspection and Termius/SSH for VPS fixes.
- After this deploy, rerun the Chrome login, grab `auth_ref` from the public URL/page, and confirm Dokploy logs have a matching `azure_oauth_callback_failed` JSON event with redacted provider details.

## 2026-07-01 09:19 CEST Auth Ref Smoke Update

- `0d1bab4 Add redacted auth diagnostics` passed both GitHub Actions workflows.
- Production smoke now checks provider-error callback `auth_ref`; current production warns on missing `auth_ref`, which is expected until the diagnostics deployment is live.
- Next verification after deploy: strict enough smoke should pass the `auth_ref` check, then Chrome login should expose an `auth_ref` that can be matched in Dokploy logs.

## 2026-07-01 09:26 CEST Auth Diagnostics Verification

- `615f097 Check auth references in production smoke` passed both GitHub Actions workflows.
- Production now has the intended error split: browser gets safe `auth_code` plus `auth_ref`; detailed provider diagnostics stay in redacted Dokploy/server logs.
- Verified a real Chrome `invalid_client` failure produced an `auth_ref`, and the same reference appears in a redacted Dokploy `azure_oauth_callback_failed` log event.
- Actual remaining auth problem: Azure reports `AADSTS700025`, which means the Azure app/client is currently public while this backend is presenting a client secret. Fix Azure app registration/client type for the confidential backend flow, or intentionally change the app to public-client PKCE without a secret.
- No Dokploy MCP is exposed in this session; use Dokploy UI in Chrome for logs and Termius/SSH for VPS/Dokploy host repairs. Do not copy secrets into logs.
- Remaining independent production gap: `/api/health` still reports unknown `sha`/`builtAt`, so strict exact-SHA smoke remains blocked until build metadata is configured.

## 2026-07-01 09:29 CEST Deployment Docs Follow-Up

- `801c672 Record auth diagnostics deploy verification` passed both GitHub Actions workflows.
- Deployment docs now spell out that Dokploy Dockerfile builds need explicit Build Time Arguments plus runtime env for `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME`; otherwise `/api/health` cannot prove the deployed commit.
- Deployment docs now spell out that the current backend OAuth flow expects a web/confidential Entra app registration with a valid client secret. Public/native client registration is the likely reason for the current `AADSTS700025`/`invalid_client` failure.

## 2026-07-01 09:36 CEST Azure Portal Diagnosis

- `7137e29 Clarify Dokploy and Azure auth setup` passed both GitHub Actions workflows.
- Production smoke for `7137e29` passed all hard gates and still warns only on unknown build metadata/SHA.
- Confirmed in Microsoft Entra App registrations that Copilot Tracker Authentication is configured as `Single-page application`, not `Web`.
- This is the exact remaining auth root cause for the current backend flow: Azure treats the callback as public-client, but the backend sends `AZURE_DEVOPS_CLIENT_SECRET`, producing `AADSTS700025` in Dokploy logs and `auth_code=invalid_client` in the browser.
- The current signed-in Chrome account can inspect the registration but cannot edit it; redirect/platform edit controls are disabled and the account is not listed as an owner.
- Next operator action: with an app-registration owner/admin account, move or add the production callback URI under the `Web` platform, keep/use the existing client secret, then rerun Chrome login and signed-in dashboard/Azure work-item E2E.

## 2026-07-01 10:23 CEST Web Redirect Retest / Profile Diagnostics

- User reports the Azure Web redirect fix is done; screenshot shows the production callback URI under `Web`.
- Production login progress: Chrome no longer returns `invalid_client`; it now returns `auth_code=profile_or_org_check_failed`, so token exchange is fixed and the next blocker is Azure profile/org validation.
- Added local redacted profile/org diagnostics for that failure stage; after deploy, use the browser `auth_ref` to find `profileResult`, `profileStatus`, `orgMembershipResult`, `orgMembershipStatus`, and `orgMembershipAccountCount` in Dokploy logs.
- Public behavior remains safe: no provider descriptions, tokens, profile payloads, organization names, or secrets in URLs/page text.
- Focused validation passed: web tests now 128 and web typecheck passes.

## 2026-07-01 10:32 CEST Profile/Org Diagnostics Verified

- `7020999 Add profile org auth diagnostics` passed GitHub Actions CI and Build extension, deployed in Dokploy, and production smoke passed all hard gates.
- Real Chrome login still fails safely with `auth_code=profile_or_org_check_failed`.
- Matching Dokploy log now proves profile lookup succeeds and org matching fails: profile OK/status 200/profile id present; org membership request OK/status 200; one account returned; configured organization not matched.
- Next operator action: check `AZURE_DEVOPS_ORG` against the account returned for the signed-in user, or adjust the signed-in user's Azure DevOps organization membership/visibility. Then rerun Chrome login and dashboard/work-item E2E.

## 2026-07-01 10:38 CEST Org URL Normalization Ready

- Retried real Chrome production login after the Azure Web redirect fix; it still fails at `profile_or_org_check_failed`.
- Dokploy log correlation for the fresh `auth_ref` again shows profile lookup succeeds and org membership does not match, with one account returned.
- Added a local source fix for a likely env-format trap: `AZURE_DEVOPS_ORG` now normalizes old-style `https://<org>.visualstudio.com` URLs as well as org slugs and `https://dev.azure.com/<org>`.
- Validation passed: web tests 131/131, typecheck, lint, extension compile/test, production-style web build, root `pnpm test`, live known-stale production smoke, and diff check.
- Next: commit/push this normalization change, wait for CI/Dokploy deploy, then retry Chrome login. If it still fails, the remaining action is to update the configured org value or the signed-in user's Azure DevOps organization membership/visibility.

## 2026-07-01 10:53 CEST Direct Org Probe Ready

- `9a3acb1` deployed successfully, but real Chrome login still failed at `profile_or_org_check_failed`; the user-provided log confirms profile OK and org account-list mismatch.
- Added a stronger local fallback: when the account-list API does not match the configured org slug, the auth flow probes the configured Azure DevOps org WIQL endpoint directly using the signed-in token.
- The probe is fail-closed and accepts only valid successful WIQL JSON; failures are logged as redacted `orgAccessProbeResult`/`orgAccessProbeStatus`.
- Validation passed: focused web tests 132/132, typecheck, lint, extension compile/test, production-style web build, clean root `pnpm test`, live known-stale production smoke, and diff check.
- Next: commit/push the probe change, wait for CI/Dokploy, then retry Chrome login and, if successful, verify dashboard and Azure work-item search.

## 2026-07-01 11:04 CEST Final Auth Diagnosis

- `01650a4 Probe configured Azure DevOps org access` passed CI/build and deployed successfully in Dokploy.
- Real Chrome login still fails safely with `profile_or_org_check_failed`.
- The new matching Dokploy log gives the useful final split: profile lookup succeeds, accounts API succeeds and returns one account, account-list org matching fails, and the configured Azure DevOps org WIQL probe returns HTTP 401.
- App-code auth flow is now well-instrumented and fail-closed. The next fix is configuration/access: set `AZURE_DEVOPS_ORG` to the org actually accessible to the signed-in user, add/repair that user's Azure DevOps org membership/visibility, or ensure Azure DevOps work-item consent/access for the configured org.
- After that change, rerun Chrome login. If it succeeds, immediately verify dashboard load and `/api/azure-devops/work-items` search from the web UI.

## 2026-07-01 11:36 CEST Auth Working

- Production Azure auth is now working after the runtime org configuration was corrected in Dokploy and a dedicated `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` was added. No org value or key value is recorded here.
- Real Chrome fresh logout/login from the visible production `Log in with Azure DevOps` link lands on `/dashboard`.
- Signed-in production `/api/azure-devops/work-items?query=test` now returns HTTP 200 with a valid JSON response. It returned zero matches for that literal query, which is fine for the auth/token-persistence check.
- `pnpm smoke:production -- --allow-known-stale --expect-sha 1506101` passes every hard gate: health/database OK, health no-store headers, Microsoft redirect, PKCE `S256`, and required Azure DevOps scopes.
- Remaining production proof gap: `/api/health` still reports unknown `sha` and `builtAt`, so configure Dokploy build metadata if strict exact-deploy proof is needed.
- Best next step: test the visible dashboard task picker/search with a known work-item query, then configure `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME` build/runtime metadata and rerun strict production smoke.

## 2026-07-01 12:19 CEST Admin Access Added

- Added the requested login to production `ADMIN_AZURE_DEVOPS_LOGINS` in Dokploy and redeployed; the admin list is not recorded here.
- Fresh real Chrome logout/login now shows Admin navigation.
- Direct production `/admin` loads admin content/export links without unauthorized state.
- Post-redeploy production smoke still passes hard gates; only unknown build metadata/SHA warnings remain.
- Best next step remains real VS Code extension usage QA against production, then strict build metadata configuration when convenient.

## 2026-07-01 12:39 CEST Extension Auth Rewrite Ready

- Real VS Code QA found a true extension blocker: `Copilot Tracker: Sign In` failed in Microsoft auth with `AADSTS65002` because VS Code's Microsoft first-party client cannot request the Azure DevOps delegated scopes the extension was asking for.
- Implemented the safer production flow: the extension opens the tracker web app, the web app mints a tracker session from the already-authenticated web session, and VS Code receives that tracker token through a `vscode://.../auth` callback. Azure DevOps tokens stay server-side.
- Added `/api/auth/extension-token`, callback URL/state validation, extension URI handler, SecretStorage token persistence, API session-bearer auth, and work-item search support via the server-stored Azure token.
- Removed the old extension Azure DevOps auth provider source and verified the rebuilt VSIX no longer packages stale `azureDevOpsAuth.js`.
- Validation passed: web tests 137/137, extension tests 29/29, web lint/typecheck/build, repo typecheck/lint, clean VSIX package, and rebuilt VSIX installed in real VS Code.
- Pending: commit/push/deploy this change, then rerun real VS Code sign-in and OTel sync against production. Production exact-SHA proof remains blocked by missing `/api/health` build metadata.

## 2026-07-01 13:17 CEST Real VS Code Path Working

- Real VS Code production sign-in now works through the tracker web callback and VS Code URI handler.
- The extension synced a realistic OTel fixture to production: one request, `gpt-5-nano`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost.
- Manual task assignment/search path works in VS Code. The picker called production work-item search with tracker session auth, then manual `124` assignment updated VS Code status and session title.
- Production dashboard reload confirmed the same session/task/token data from the VS Code sync.
- A real reliability bug was found and fixed locally: repeated Copilot OTel `outfile` writes caused lifecycle rebuild/event spam. The local VSIX now coalesces rebuilds, uses the active OTel path for polling/syncing, and ignores self-caused OTel config-change events.
- Validation passed after the fix: typecheck, lint, placeholder-env web build, extension compile/test, workspace tests, smoke tests, VSIX install, and real VS Code post-reload log sampling.
- Next: commit/push the OTel lifecycle fix and QA logs, wait for CI/Dokploy, rerun production smoke, and keep the dashboard tab as useful handoff context. Production exact-SHA proof still needs build metadata.

## 2026-07-01 13:23 CEST OTel Fix Pushed And Green

- `ae3d4e4 Stabilize extension OTel lifecycle` is pushed to `main`.
- GitHub Actions `CI` and `Build extension` both passed for `ae3d4e4`.
- Live production smoke passes hard gates with `pnpm smoke:production -- --allow-known-stale --expect-sha ae3d4e4`.
- The remaining warning is unchanged: `/api/health` still reports unknown SHA/build time, so strict exact-SHA production proof needs Dokploy build metadata configuration.
- Current practical status: Azure web auth works, the requested admin access is active, real VS Code sign-in/sync/task assignment/status/click-through works, and the reliability bug found during real VS Code testing is fixed and pushed.

## 2026-07-01 13:35 CEST Docker Build Metadata Fallback Ready

- Added a source-side fallback for the remaining exact-SHA proof gap: Docker builds now generate a build-info module from explicit metadata, common source env names, or minimal `.git` refs before `next build`.
- `/api/health` now reads that generated module only after explicit runtime env and common env fallbacks, so operator-provided metadata still wins. A generated JSON file fallback remains for compatibility.
- Local validation passed: smoke/script tests, web tests, lint/typecheck, repo lint/typecheck, production-style web build, extension compile/test, root tests, compose config, and diff check.
- Full local Docker image build remains unverified because Docker Desktop/daemon is not reachable from this machine.
- Next: commit/push, wait for CI/Dokploy, then run `pnpm smoke:production -- --expect-sha <latest-sha>` without known-stale mode.

## 2026-07-01 13:57 CEST Exact Deploy Proof Working

- `23e4df9 Compile Docker build metadata` is pushed, CI-green, and deployed by Dokploy.
- Strict production smoke now passes without known-stale mode: `pnpm smoke:production -- --expect-sha 23e4df9`.
- `/api/health` reports the exact deployed SHA and a non-unknown build time, so the prior deployment-freshness proof gap is closed.
- The earlier generated JSON file fallback was deployed first but did not affect health metadata; the working fix is the generated TypeScript module compiled before `next build`.

## 2026-07-01 14:06 CEST Work-Item Search UX/API

- `f90a5b0 Record exact deploy proof verification` is pushed and CI-green; production was still serving the previous verified `23e4df9` build when checked.
- Live signed-in dashboard search returned HTTP 200 with zero matches for safe probe queries, so a true Azure DevOps matching-result test is data-blocked for now.
- Implemented and locally verified a focused improvement: text search now falls back from empty words-query results to substring WIQL, and numeric empty states identify that Azure DevOps has no match for the ID.
- Next: commit/push this work-item search change, then verify CI, Dokploy, strict production smoke, and the deployed dashboard picker status.

## 2026-07-01 14:22 CEST Work-Item Search Live

- `6477f9c Improve Azure DevOps work-item search` is pushed, CI-green, built by Dokploy, and live in production.
- Strict production smoke passes for `6477f9c` after using Dokploy app `Reload`; the initial Dokploy "done" state still served `23e4df9`, so stale deploy detection is doing its job.
- Live signed-in dashboard verification passed: numeric task `124` shows `No Azure DevOps match for this ID`, and text query `login` shows `No Azure DevOps matches`.
- Remaining operational follow-up: understand why this Dokploy build needed a manual Reload after a successful Dockerfile build, or document Reload as the fallback when strict smoke catches stale production.

## 2026-07-01 14:26 CEST Deployment Docs Updated

- `docs/deployment.md` now documents the exact Dokploy stale-rollout recovery: if deployment is done but strict smoke still sees the previous SHA, use General -> Reload and rerun strict smoke.
- The docs also clarify that generated build metadata proves the image, while production smoke proves the running service.
- Local doc diff check passed, and production still passes strict smoke for deployed app commit `6477f9c`.

## 2026-07-01 14:31 CEST Picker Keyboard Coverage

- Added pure regression coverage for WorkItemPicker active-result movement: ArrowUp/ArrowDown bounds and stale-index clamping.
- This improves the previous picker coverage gap without adding a new DOM test dependency; true rendered/browser component coverage remains a future improvement.
- Local checks passed: web tests/typecheck/lint, production-style web build, smoke tests, repo typecheck/lint, root tests, and diff check.

## 2026-07-01 14:42 CEST Picker Coverage Live

- `d19e76c Cover work-item picker keyboard movement` is pushed, CI-green, built by Dokploy, and live in production after Dokploy app Reload.
- Strict production smoke passes for `d19e76c`.
- Dokploy repeated the "done but stale until Reload" behavior, strengthening the case that Reload should remain part of the fallback playbook when strict smoke catches stale production.

## 2026-07-01 14:49 CEST OAuth Callback Coverage In Progress

- Added a small test seam for the Azure OAuth callback route without changing the default production route dependencies.
- Added route-level coverage for successful session creation and safe session-creation failure handling.
- Focused web checks pass: 146 web tests, web typecheck, and web lint.
- Broad validation also passes: repo typecheck/lint, production-style web build, extension compile/test, smoke tests, root tests, diff check, and strict production smoke for deployed `d19e76c`.
- Next: commit/push, verify CI and Dokploy deployment, then rerun strict production smoke for the new app commit.
