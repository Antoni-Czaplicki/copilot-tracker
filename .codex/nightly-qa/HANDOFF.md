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
