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
