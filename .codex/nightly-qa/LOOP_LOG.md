# Nightly QA Loop Log

## 2026-07-01 01:50:33 CEST - Loop 1 Start

- Created the persistent nightly QA directory and seed status/plan/log files.
- Confirmed recent git history starts at `8c0d915 Show Azure token exchange errors`.
- No blocker at loop start.
- Next: spawn subagents and inspect the repo locally.

## 2026-07-01 01:56:57 CEST - Loop 1 Progress

- Spawned and merged focused subagent reports for extension, web UX, API/backend, deployment, security/privacy, Azure auth, and test strategy.
- Imported a 110+ case test matrix into `TEST_CASES.md`.
- Implemented the first extension-focused patch: safer branch task extraction, quick-pick async settlement guards, active-editor context refresh, and friendly dashboard URL validation.
- Next: run extension compile/test/lint and continue to the highest-value web/auth/API/deployment issue.

## 2026-07-01 02:00:41 CEST - Loop 1 Progress

- Committed and pushed extension hardening as `39568ea Harden extension task assignment UX`.
- Implemented OAuth callback hardening: stable failure codes, no provider descriptions in redirect URLs, and OAuth cookie clearing on callback failure branches.
- Validated OAuth patch with web typecheck, lint, and placeholder production build.
- Next: commit/push OAuth patch, then verify production freshness and continue with deployment/API fixes.

## 2026-07-01 02:04:48 CEST - Loop 1 Progress

- Committed and pushed OAuth callback hardening as `f85f30e Harden Azure OAuth callback failures`.
- Production checks: homepage and Azure PKCE redirect are healthy, work-items API is auth-gated, login link is document navigation, but provider-error redirect still reflects descriptions, indicating production lag/staleness.
- Implemented deployment health/readiness and secret-contract slice: `/api/health`, Docker healthcheck/build metadata, CI web build, env example, production encryption-key requirement, and README updates.
- Validated with repo typecheck, lint, extension tests, placeholder production web build, and local health smoke.
- Docker image build is blocked because Docker daemon is not running.
- Next: commit/push deployment slice and poll production for deployment freshness.

## 2026-07-01 02:08:25 CEST - Loop 1 Progress

- Committed and pushed deployment health checks as `03c390b Add deployment health checks`.
- Production remained stale immediately after push: `/api/health` returned 404 and provider-error redirect still reflected descriptions.
- Implemented API boundary validation for malformed GitHub login JSON, admin export type whitelist, and billing sync date validation.
- Validated API slice with web typecheck, lint, and placeholder production build.
- Next: commit/push API validation and poll production again.

## 2026-07-01 02:12:17 CEST - Loop 1 Progress

- Committed and pushed API boundary validation as `32a4cfd Validate web API boundaries`.
- Implemented request grid task editing UX: reachable single-row task editor with Azure work-item search, row override after confirmed save, mobile horizontal overflow, and `updated: 0` guard for bulk/session assignment.
- Validated UI slice with web lint, typecheck, and placeholder production build.
- Next: commit/push UI slice and poll production freshness again.

## 2026-07-01 02:13 CEST - Loop 1 Progress

- Committed and pushed request grid UX as `392f9ca Expose request task editing in grid`.
- Production poll showed OAuth privacy fix live but `/api/health` still 404, indicating production had not deployed the health/build metadata commit.
- Adjusted token encryption behavior to avoid deployment-blocking startup failure when the dedicated encryption key is absent: the app no longer falls back to the Azure client secret and does not persist session tokens without the dedicated key.
- Next: validate/commit/push recovery and poll production.

## 2026-07-01 02:15:51 CEST - Loop 1 Progress

- Committed and pushed token-storage deployment recovery as `a85225d Avoid blocking deploy without token key`.
- Implemented leaderboard privacy gate: `/leaderboard` and nav link are admin-only while still controlled by the existing feature flag.
- Validated with web lint, typecheck, and placeholder production build.
- Next: commit/push leaderboard gate and poll production.

## 2026-07-01 02:18:52 CEST - Loop 1 Progress

- Committed and pushed leaderboard privacy gate as `91d2a7a Restrict leaderboard to admins`.
- GitHub Actions for recent commits are passing/in progress; production still had `/api/health` 404 at last poll.
- Implemented token payload integer bounds to prevent PostgreSQL integer overflow failures.
- Validated with web typecheck, lint, and placeholder production build.
- Next: commit/push token bounds and poll CI/production.

## 2026-07-01 02:20:45 CEST - Loop 1 Progress

- Committed and pushed token integer bounds as `93dd101 Validate token integer bounds`.
- Implemented Drizzle migration env contract: no silent localhost `DATABASE_URL` fallback.
- Validated with web typecheck, lint, and placeholder production build.
- Next: commit/push Drizzle contract and poll CI/production.

## 2026-07-01 02:22:21 CEST - Loop 1 Progress

- Committed and pushed Drizzle env contract as `44ed412 Require database URL for migrations`.
- Production remained without `/api/health`; current commit CI was in progress at last check.
- Updated batch ingest response semantics so `accepted` reflects processed/upserted requests while `received` keeps the raw input count.
- Validated with web typecheck and lint.
- Next: commit/push response semantics and poll CI/production.

## 2026-07-01 02:25:24 CEST - Loop 1 Progress

- Committed and pushed batch response semantics as `4bab582 Report processed batch request counts`.
- Production still lacked `/api/health`; GitHub CI/builds remained healthy or in progress.
- Implemented extension current-session tooltip changes so partial/missing token data is reflected as incomplete data and lower-bound cost.
- Validated with extension compile/lint/test via `pnpm --filter ./apps/extension test`.
- Next: commit/push extension cost display and poll CI/production.

## 2026-07-01 02:27:00 CEST - Loop 1 Progress

- Committed and pushed extension partial-token cost display as `053541f Clarify partial token cost display`.
- Removed deprecated global selected-task fallback to prevent stale manual tasks leaking across workspaces.
- Validated with extension compile/lint/test.
- Next: commit/push workspace task isolation and poll CI/production.

## 2026-07-01 02:28:38 CEST - Loop 1 End

- Worktree clean after `815ae6f Isolate selected tasks by workspace`.
- First loop delivered multiple focused commits across extension UX, OAuth security, deployment readiness, API validation, web task assignment UX, privacy gates, and docs/logging.
- Latest GitHub CI for `815ae6f` was still in progress at loop end.
- Production remains partially stale: OAuth privacy fix is live, but `/api/health` is still 404, so deployment has not reached the health/readiness commits.
- Carry forward blockers: Docker daemon unavailable; no direct Dokploy deployment visibility from repo; production freshness unresolved.

## 2026-07-01 02:28:38 CEST - Loop 2 Start

- Starting from clean worktree at `815ae6f`.
- Next actions: poll CI/production, keep investigating deployment freshness, and continue reducing remaining findings.

## 2026-07-01 02:31:13 CEST - Loop 2 Progress

- Implemented admin billing sync UX: client-side POST button with loading/success/error states and page refresh after success.
- Validated with web typecheck, lint, and placeholder production build.
- Production still lacked `/api/health` at last poll; GitHub CI/builds were green or in progress.
- Next: commit/push admin billing sync UX and poll CI/production.

## 2026-07-01 02:33:13 CEST - Loop 2 Progress

- Committed and pushed admin billing sync UX as `fd45703 Improve admin billing sync UX`.
- Production smoke passed: homepage, `/api/health`, database readiness, Azure PKCE redirect/scopes, provider-error privacy, work-items auth gate, admin export auth gate, and Chrome homepage/login-link check.
- Remaining deployment limitation: `/api/health` reports `version.sha="unknown"`, so exact deployed commit is not provable until Dokploy passes build metadata.
- Next: commit production verification logs and continue with remaining gaps.

## 2026-07-01 02:34:55 CEST - Loop 2 Progress

- Committed and pushed production smoke logs as `76454ea Record production smoke verification`.
- Re-ran full current-head local checks: repo typecheck, repo lint, extension tests, and web production build all passed.
- GitHub build-extension run for `76454ea` passed; CI was still in progress.
- Next: commit verification logs and continue remaining gaps.

## 2026-07-01 02:36:29 CEST - Loop 2 Progress

- Committed and pushed full verification logs as `59a09b0 Record full verification sweep`.
- Tried real Chrome Azure login flow using existing browser session.
- Result: production returned home with `auth=failed&auth_code=invalid_client`; no provider description was reflected.
- Classified full signed-in production E2E as blocked by external Azure client configuration.
- Next: commit auth blocker logs and continue non-auth-blocked testing/fixes.

## 2026-07-01 02:38:33 CEST - Loop 2 Progress

- Committed and pushed auth blocker logs as `3d9a7a0 Record production auth blocker`.
- Updated README and homepage copy to match safer branch task detection behavior.
- Validated with web typecheck, lint, and placeholder production build.
- Next: commit docs/copy alignment and continue non-auth-blocked gaps.

## 2026-07-01 02:40:46 CEST - Loop 2 Progress

- Committed and pushed task-detection copy alignment as `ecebf93 Align task detection copy`.
- Added compose app service for app+Postgres container smoke modeling.
- Validated compose syntax with `docker compose config`.
- Docker daemon remains unavailable, so actual image/container startup remains blocked.
- Next: commit compose service and continue non-auth-blocked gaps.

## 2026-07-01 02:50:11 CEST - Loop 2 Progress

- Resumed after context compaction at `f19a366` with a focused privacy redaction patch in progress.
- Hardened extension structured logging to redact local workspace/repository/storage/file fields and token-like fields.
- Updated `Show Current Context` so it reports repository/storage presence without displaying raw local paths or remotes.
- Added a logger regression test covering local path, remote URL, nested storage path, file path, token redaction, and retained non-sensitive context.
- Next: run extension tests, update findings/changes, commit/push, then continue remaining non-auth-blocked gaps.

## 2026-07-01 02:55:02 CEST - Loop 2 Progress

- Committed and pushed extension log/context privacy hardening as `d260639 Redact extension local context logs`.
- Validation for the slice passed: `pnpm --filter ./apps/extension test` reported 7 passing tests.
- Next: poll CI/production and continue with remaining test/quality gaps that do not require a working production Azure client.

## 2026-07-01 02:57:30 CEST - Loop 2 Progress

- Added a lightweight web/domain test harness with Node `--test` and `tsx`.
- Added 12 web tests for payload schema bounds, batch caps, task assignment trimming, GitHub login normalization, pricing math/formatting, and auth callback code sanitization.
- Wired web tests into CI before the production web build.
- Validation passed: web test, lint, typecheck, and placeholder production build.
- Next: run broader repo checks, commit/push, then poll CI/production.

## 2026-07-01 03:00:28 CEST - Loop 2 Progress

- Broader verification passed after the web test harness: `pnpm -r typecheck`, `pnpm -r lint`, and `pnpm --filter ./apps/extension test`.
- Previous slice validation also passed: `pnpm --filter @copilot-tracker/web test` and placeholder production web build.
- Next: inspect diff, commit/push, then poll CI and production.

## 2026-07-01 03:03:03 CEST - Loop 2 Progress

- Committed and pushed web domain test harness as `87a7372 Add web domain test harness`.
- Latest local checks before commit: web test/lint/typecheck/build, repo typecheck/lint, and extension tests all passed.
- Next: poll GitHub Actions and production; continue with remaining route/integration/deployment gaps.

## 2026-07-01 03:08:30 CEST - Loop 2 Progress

- Added extension OTel upload signature cache to skip reposting unchanged request records across syncs/restarts.
- Cache signatures ignore volatile `capturedAt` but include stable metadata so task/session/token changes still upload.
- Added extension tests for unchanged-record skipping, metadata-change reupload, and per-workspace cache state.
- Validation passed: `pnpm --filter ./apps/extension test` reported 9 passing tests.
- Next: run broader repo checks, commit/push, then poll CI/production.

## 2026-07-01 03:10:09 CEST - Loop 2 Progress

- Broader checks passed after the OTel upload cache: `pnpm -r typecheck`, `pnpm -r lint`, and `pnpm test:web`.
- Extension tests for the changed slice already passed with 9 tests.
- Next: inspect diff, commit/push, then poll CI/production.

## 2026-07-01 03:12:18 CEST - Loop 2 Progress

- Committed and pushed OTel unchanged-upload skipping as `322bc7d Skip unchanged OTel request uploads`.
- Local checks before commit: extension test, repo typecheck, repo lint, and web tests all passed.
- Next: poll GitHub Actions/production and continue remaining route/integration/deployment gaps.

## 2026-07-01 03:17:28 CEST - Loop 2 Progress

- Hardened Azure DevOps WIQL query generation for task search.
- Numeric work-item queries now reject unsafe IDs and out-of-bounds values instead of emitting invalid WIQL; search limits clamp/fallback safely.
- Added 3 web tests for numeric ID query generation, unsafe numeric rejection, text escaping, and default limit fallback.
- Validation passed: web test, lint, typecheck, and placeholder production build.
- Next: inspect diff, commit/push, then poll CI/production.

## 2026-07-01 03:20:04 CEST - Loop 2 End

- Committed and pushed Azure DevOps WIQL hardening as `0ad0d72 Harden Azure work item WIQL queries`.
- Loop 2 delivered admin billing sync UX, production smoke verification, auth blocker documentation, branch task copy alignment, compose app service modeling, production/test status logs, extension privacy hardening, web domain tests, OTel unchanged-upload skipping, and WIQL hardening.
- Carry-forward blockers: production Azure login `invalid_client`, Docker daemon unavailable, exact production commit still unknown because health SHA is `unknown`.

## 2026-07-01 03:20:04 CEST - Loop 3 Start

- Starting loop 3 from `0ad0d72` with only nightly status files dirty.
- Next actions: poll latest CI/production, then continue improving route/integration coverage and deployment clarity.

## 2026-07-01 03:25:12 CEST - Loop 3 Progress

- Added tracked deployment contract documentation for Docker/Dokploy env names, build metadata, Azure app registration, and production smoke checks.
- Updated compose build/runtime metadata args to read environment-provided SHA/build time with local fallbacks.
- Added `.codex` to `.dockerignore` so nightly QA logs are not included in Docker build contexts.
- Validation passed: `docker compose config` and `git diff --check`.
- Next: inspect diff, commit/push deployment docs, then poll CI/production.

## 2026-07-01 03:28:03 CEST - Loop 3 Progress

- Committed and pushed deployment contract documentation as `b62b80f Document deployment contract`.
- Validation before commit: `docker compose config` and `git diff --check` passed.
- Next: poll CI/production and continue remaining coverage/UX gaps.

## 2026-07-01 03:34:05 CEST - Loop 3 Progress

- Improved `WorkItemPicker` debounce UX so stale results are hidden and `Searching` appears while a new query is pending.
- Preserved completed empty-result feedback as `No matches` after the query result returns.
- Validation passed: web test, lint, typecheck, and placeholder production build.
- Next: inspect diff, commit/push picker UX, then poll CI/production.

## 2026-07-01 03:36:42 CEST - Loop 3 Progress

- Committed and pushed WorkItemPicker debounce UX polish as `9dd76d3 Polish work item picker debounce state`.
- Validation before commit: web test, lint, typecheck, and placeholder production build passed.
- Next: poll CI/production and continue remaining route/integration/UX gaps.

## 2026-07-01 03:42:18 CEST - Loop 3 Progress

- Fixed OTel upload cache scoping so signatures are separated by tracker server origin and workspace.
- This preserves unchanged-upload skipping while ensuring server URL changes upload historical records to the new destination.
- Validation passed: `pnpm --filter ./apps/extension test` reported 9 passing tests.
- Next: inspect diff, commit/push server-scoped cache, then poll CI/production.

## 2026-07-01 03:45:06 CEST - Loop 3 Progress

- Committed and pushed server-scoped OTel upload cache as `819393f Scope OTel upload cache by server`.
- Validation before commit: `pnpm --filter ./apps/extension test` passed with 9 tests.
- Next: poll CI/production and continue remaining gaps.

## 2026-07-01 03:49:26 CEST - Loop 3 Progress

- Removed local OS username from extension tracker events; events now use generic `vscode-extension` while the backend stamps authenticated identity.
- Validation passed: `pnpm --filter ./apps/extension test` reported 9 passing tests.
- Next: inspect diff, commit/push event privacy, then poll CI/production.

## 2026-07-01 03:51:24 CEST - Loop 3 Progress

- Committed and pushed extension event user privacy as `7cfd221 Avoid local usernames in extension events`.
- Validation before commit: `pnpm --filter ./apps/extension test` passed with 9 tests.
- Next: poll CI/production and continue remaining gaps.

## 2026-07-01 03:53:18 CEST - Loop 3 Progress

- Ran real Chrome production smoke: homepage title/copy and login anchor passed.
- Real Chrome auth flow still returns `auth_code=invalid_client`, matching the known external Azure client blocker.
- Verified the visible failure UI remains safe: stable code only, no provider description or secret values.
- Closed the Chrome tab/session.
- Next: continue non-auth-blocked improvements while latest CI runs.

## 2026-07-01 04:00:12 CEST - Loop 3 Progress

- Tightened extension tracker server URL validation to accept only safe origins.
- URLs with path, credentials, query, fragment, malformed values, or non-local HTTP now fail explicitly instead of being silently normalized/ignored.
- Validation passed: `pnpm --filter ./apps/extension test` reported 10 passing tests.
- Next: inspect diff, commit/push server URL validation, then poll CI/production.

## 2026-07-01 04:02:18 CEST - Loop 3 Progress

- Committed and pushed extension server URL validation as `d70c981 Validate extension server origins`.
- Validation before commit: `pnpm --filter ./apps/extension test` passed with 10 tests.
- Next: poll CI/production and continue remaining gaps.

## 2026-07-01 04:07:44 CEST - Loop 3 Progress

- Moved admin export type validation before full database export loading.
- Unsupported export types now return 400 without reading all export data.
- Validation passed: web lint, typecheck, and placeholder production build.
- Next: inspect diff, commit/push admin export validation order, then poll CI/production.

## 2026-07-01 03:22:18 CEST - Loop 3 Progress

- Local system clock check reports 03:22 CEST; using system clock timestamps from here while preserving earlier headings as written.
- Committed and pushed admin export validation-order hardening as `da1e800 Validate admin export type before loading data`.
- Post-push polling: GitHub Actions for `da1e800` are in progress; prior `d70c981` CI and extension build completed successfully.
- Production health still returns OK with database ready, but build metadata remains `sha=unknown`.
- Sanitized Azure redirect check still passes: Microsoft host, state present, PKCE `S256`, and required scopes present.
- Next: continue the next non-auth-blocked route/integration gap while CI finishes.

## 2026-07-01 03:25:27 CEST - Loop 3 Progress

- GitHub Actions for `da1e800` completed successfully on both CI and extension build workflows.
- Extracted admin export CSV/type helpers into `apps/web/src/lib/adminExport.ts`.
- Added pure tests for export type parsing, request CSV quoting, captured-only placeholder filtering, and GitHub billing CSV export rows.
- Validation passed: `pnpm --filter @copilot-tracker/web test` now reports 19 tests, plus web lint, typecheck, and placeholder production build with the current env names.
- Note: an initial build attempt used obsolete placeholder env names and failed expected `NEXT_PUBLIC_APP_URL` HTTPS validation; rerun with the live env contract passed.
- Next: inspect diff, commit/push admin export coverage, then poll CI/production again.

## 2026-07-01 03:27:25 CEST - Loop 3 Progress

- Committed and pushed admin export coverage as `1dbdf10 Add admin export coverage`.
- Local tree is clean after push.
- GitHub Actions for `1dbdf10` are in progress; prior `da1e800` CI and extension build passed.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:28:37 CEST - Loop 3 Progress

- GitHub Actions for `1dbdf10` completed successfully on both CI and extension build workflows.
- Confirmed Node reports IPv6 localhost hostnames as `[::1]`, while extension URL validation only allowed `::1`.
- Fixed extension tracker server URL validation to treat `http://[::1]:3737` as a local origin.
- Validation passed: `pnpm --filter ./apps/extension test` reported 10 passing tests.
- Next: inspect diff, commit/push IPv6 localhost fix, then poll CI/production.

## 2026-07-01 03:30:02 CEST - Loop 3 Progress

- Committed and pushed IPv6 localhost server URL support as `e4e49ee Allow IPv6 localhost tracker server`.
- Local tree is clean after push.
- GitHub Actions for `e4e49ee` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:34:08 CEST - Loop 3 Progress

- GitHub Actions for `e4e49ee` completed successfully on both CI and extension build workflows.
- Added web/API support for clearing task assignments with `selectedTask: null`.
- Added clear actions for single request rows, selected request bulk edits, and whole sessions; cleared rows fall back to branch-derived defaults in the display.
- Added schema coverage for nullable task assignment payloads.
- Validation passed: web test suite now reports 20 tests, plus web lint, typecheck, and placeholder production build.
- Next: inspect diff, commit/push web task clearing support, then poll CI/production.

## 2026-07-01 03:36:00 CEST - Loop 3 Progress

- Committed and pushed web task clearing as `be7beec Support clearing web task assignments`.
- Local tree is clean after push.
- GitHub Actions for `be7beec` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:38:37 CEST - Loop 3 Progress

- GitHub Actions for `be7beec` completed successfully on both CI and extension build workflows.
- Added safe, code-specific Azure OAuth failure hints for stable auth failure codes while continuing to suppress provider descriptions.
- Reused the shared auth callback sanitizer on the homepage and removed duplicate local sanitization logic.
- Added tests for common auth hints and unknown-code suppression.
- Validation passed: web test suite now reports 22 tests, plus web lint, typecheck, and placeholder production build.
- Next: inspect diff, commit/push auth failure hints, then poll CI/production.

## 2026-07-01 03:40:22 CEST - Loop 3 Progress

- Committed and pushed safe Azure auth failure hints as `f15b18c Add safe Azure auth failure hints`.
- Local tree is clean after push.
- GitHub Actions for `f15b18c` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:41:27 CEST - Loop 3 Progress

- GitHub Actions for `f15b18c` completed successfully on both CI and extension build workflows.
- Replaced the extension's default placeholder sample test with a real cost-estimation regression for known model input/output token pricing.
- Validation passed: `pnpm --filter ./apps/extension test` reported 10 passing tests.
- Next: inspect diff, commit/push extension test cleanup, then poll CI/production.

## 2026-07-01 03:43:06 CEST - Loop 3 Progress

- Committed and pushed extension sample test replacement as `0e63df4 Replace extension sample test`.
- Local tree is clean after push.
- GitHub Actions for `0e63df4` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:44:32 CEST - Loop 3 Progress

- Production auth-hint poll showed deploy lag: `invalid_client` renders as a stable code but the new safe hint is not live yet.
- Production unknown-code auth poll did not show invented hint copy, which is the expected safe behavior.
- Fixed homepage task-detection copy spacing so `feature/124-login` and `all map` do not run together.
- Validation passed: web test, lint, typecheck, and placeholder production build.
- Next: inspect diff, commit/push landing copy spacing fix, then poll CI/production.

## 2026-07-01 03:46:22 CEST - Loop 3 Progress

- Committed and pushed homepage task example spacing as `eb93d5e Fix homepage task example spacing`.
- Local tree is clean after push.
- GitHub Actions for `0e63df4` completed successfully on both CI and extension build workflows.
- GitHub Actions for `eb93d5e` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:48:03 CEST - Loop 3 Progress

- GitHub Actions for `eb93d5e` completed successfully on both CI and extension build workflows.
- Verified `apps/web/.env.example` exists and matches the current env contract.
- Scanned app/docs/workflow paths for `Sample test`, placeholder sample text, `TODO`, and `FIXME`; none remained in the scanned source/docs paths.
- Confirmed extension activation `workspaceFolders` logs are covered by the logger redaction key list.
- Next: continue the next non-auth-blocked improvement.

## 2026-07-01 03:48:57 CEST - Loop 3 Progress

- Updated README task docs to mention clearing manual assignments back to branch-derived defaults or no task.
- Expanded the README Web API list for bulk task updates, Azure DevOps work-item search, GitHub login mapping, and current admin export types.
- Validation passed: `git diff --check`.
- Next: inspect diff, commit/push README docs alignment, then continue.

## 2026-07-01 03:50:41 CEST - Loop 3 Progress

- Committed and pushed README task/API docs alignment as `6991f4a Align README task and API docs`.
- Local tree is clean after push.
- GitHub Actions for `6991f4a` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:52:05 CEST - Loop 3 Progress

- Found that README's full-build command omitted placeholder env values required by production build validation.
- Updated the command with `NEXT_PUBLIC_APP_URL`, Azure placeholder values, and `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY`.
- Validation passed: ran the documented `pnpm build` command successfully.
- Next: inspect diff, commit/push README build command alignment, then continue.

## 2026-07-01 03:54:01 CEST - Loop 3 Progress

- Committed and pushed README build command fix as `c4a3e1c Fix README build command`.
- Local tree is clean after push.
- GitHub Actions for `6991f4a` completed successfully on both CI and extension build workflows.
- GitHub Actions for `c4a3e1c` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:55:11 CEST - Loop 3 Progress

- GitHub Actions for `c4a3e1c` completed successfully on both CI and extension build workflows.
- Updated root `pnpm test` to run the web regression suite before the extension VS Code suite.
- Validation passed: `pnpm test` ran 22 web tests and 10 extension tests successfully.
- Next: inspect diff, commit/push root test script coverage, then continue.

## 2026-07-01 03:57:10 CEST - Loop 3 Progress

- Committed and pushed root test script coverage as `a584f11 Run web tests from root test script`.
- Local tree is clean after push.
- GitHub Actions for `a584f11` are in progress.
- Production health still returns OK with database ready and `version.sha="unknown"`.
- Next: continue the next non-auth-blocked improvement while CI runs.

## 2026-07-01 03:59:18 CEST - Loop 3 Progress

- Previous commit CI is green for both CI and extension build jobs.
- Found a dashboard UX regression: task pagination links dropped `sessionId`, so opening the tracker from the extension and paging task summaries lost the focused session.
- Moved task pagination href construction into a tested helper and wired dashboard pagination through it.
- Next: run web lint/typecheck/tests/build, then commit if clean.

## 2026-07-01 04:00:42 CEST - Loop 3 Progress

- Validation passed for dashboard focused-session pagination.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (24 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (24 web tests + 10 extension VS Code tests)
- Next: inspect diff, commit, push, and keep polling deployment/CI.

## 2026-07-01 04:01:41 CEST - Loop 3 Progress

- Committed and pushed dashboard focused-session pagination as `c67f8fa Preserve dashboard session focus in pagination`.
- GitHub Actions started for `c67f8fa` (CI and extension build in progress).
- Production `/api/health` remains OK with DB ready; build metadata still reports `sha="unknown"` and `builtAt="unknown"`.
- Local tree is clean immediately after push.
- Next: poll checks and continue with the next non-auth-blocked gap.

## 2026-07-01 04:02:43 CEST - Loop 3 Progress

- Starting the next focused improvement while `c67f8fa` checks run.
- Selected auth helper coverage because production Azure login is externally blocked but local cookie security and PKCE behavior are controllable.
- Plan: split cookie-security and PKCE helpers into small testable modules, keep existing `auth.ts` exports stable, and add direct `node:test` coverage.

## 2026-07-01 04:04:55 CEST - Loop 3 Progress

- Split auth cookie policy and OAuth PKCE challenge generation into testable helper modules while preserving the existing `auth.ts` export surface.
- Added tests for secure-cookie scheme selection, malformed URL fallback, removal-safe expired cookie attributes, PKCE verifier/challenge format, and fresh PKCE generation.
- First validation pass caught an unused import and env-backed test setup; both were fixed.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (30 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (30 web tests + 10 extension VS Code tests)
- PASS: GitHub Actions for `c67f8fa Preserve dashboard session focus in pagination` completed successfully.
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:06:30 CEST - Loop 3 Progress

- Committed and pushed auth cookie/PKCE helper coverage as `b1d5098 Add auth cookie and PKCE coverage`.
- GitHub Actions for `b1d5098` are queued/in progress.
- Production `/api/health` remains OK with DB ready; build metadata still reports `sha="unknown"` and `builtAt="unknown"`.
- Local tree is clean immediately after push.
- Next: poll checks while selecting the next non-auth-blocked improvement.

## 2026-07-01 04:07:46 CEST - Loop 3 Progress

- Starting OAuth route-level test coverage with safe placeholder env.
- Verified manually that the start route returns a Microsoft redirect with PKCE cookies and that provider-error callbacks redirect safely while clearing OAuth cookies.
- Next: add automated `node:test` coverage for these redirect/cookie branches.

## 2026-07-01 04:09:59 CEST - Loop 3 Progress

- Added route-level tests for Azure OAuth start redirects, PKCE state/verifier cookies, provider-error callback privacy, state mismatch, and missing code/verifier failure.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (35 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (35 web tests + 10 extension VS Code tests)
- PASS: GitHub Actions for `b1d5098 Add auth cookie and PKCE coverage` completed successfully.
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:11:44 CEST - Loop 3 Progress

- Committed and pushed OAuth route coverage as `96d1148 Add Azure OAuth route coverage`.
- GitHub Actions for `96d1148` are in progress for CI and extension build.
- Production `/api/health` remains OK with DB ready; build metadata still reports `sha="unknown"` and `builtAt="unknown"`.
- Local tree is clean immediately after push.
- Next: poll checks while selecting the next non-auth-blocked improvement.

## 2026-07-01 04:12:19 CEST - Loop 3 Progress

- Starting mocked Azure token exchange coverage while `96d1148` checks run.
- Goal: verify `exchangeAzureDevOpsCode` sends the PKCE `code_verifier`, uses the configured redirect/scope, parses successful token payloads, and maps Azure JSON failures to `AzureDevOpsTokenExchangeError`.

## 2026-07-01 04:14:28 CEST - Loop 3 Progress

- Added mocked token exchange tests covering successful request body construction and Azure JSON error mapping.
- First validation pass caught fetch mock typing/lint issues and one strict object assertion; fixed before final validation.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (37 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (37 web tests + 10 extension VS Code tests)
- PASS: GitHub Actions for `96d1148 Add Azure OAuth route coverage` completed successfully.
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:15:49 CEST - Loop 3 Progress

- Committed and pushed token exchange coverage as `0a093ad Add Azure token exchange coverage`.
- GitHub Actions for `0a093ad` are in progress for CI and extension build.
- Production `/api/health` remains OK with DB ready; build metadata still reports `sha="unknown"` and `builtAt="unknown"`.
- Local tree is clean immediately after push.
- Next: poll checks while selecting the next non-auth-blocked improvement.

## 2026-07-01 04:16:36 CEST - Loop 3 Progress

- Starting Azure DevOps work-item search coverage.
- Plan: mock `fetch` to cover WIQL search plus batch mapping, 400 fallback to the second text query, rate-limit error mapping, and the no-query API route response that does not require auth.

## 2026-07-01 04:19:36 CEST - Loop 3 Progress

- Added mocked Azure DevOps work-item search tests for WIQL ID results flowing into batch-field mapping, first-WIQL 400 fallback to the second text query, repeated 429 rate-limit errors, and blank-query route empty state.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (41 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (41 web tests + 10 extension VS Code tests)
- PASS: GitHub Actions for `0a093ad Add Azure token exchange coverage` completed successfully.
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:21:07 CEST - Loop 3 Progress

- Committed and pushed work-item search coverage as `15d76ee Add Azure work item search coverage`.
- GitHub Actions for `15d76ee` are queued/in progress for CI and extension build.
- Production `/api/health` remains OK with DB ready; build metadata still reports `sha="unknown"` and `builtAt="unknown"`.
- Local tree is clean immediately after push.
- Next: poll checks while selecting the next non-auth-blocked improvement.

## 2026-07-01 04:22:25 CEST - Loop 3 Progress

- Starting extension `TrackerClient` coverage.
- Plan: add VS Code extension tests for work-item search auth options/request parsing, remote server unauthenticated rejection, and HTTP error body surfacing.

## 2026-07-01 04:26:02 CEST - Loop 3 Progress

- Added extension `TrackerClient` tests for interactive work-item auth/search requests, remote-server no-token blocking, server JSON error surfacing, and network retry failure surfacing.
- First network test pass exposed background extension traffic sharing the global fetch mock; narrowed the throwing mock to the chat-request endpoint and let unrelated background calls succeed.
- PASS: `pnpm --filter ./apps/extension test` (14 tests)
- PASS: `pnpm test` (41 web tests + 14 extension VS Code tests)
- PASS: GitHub Actions for `15d76ee Add Azure work item search coverage` completed successfully.
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:27:20 CEST - Loop 3 Progress

- Committed and pushed extension TrackerClient coverage as `96bab47 Add extension TrackerClient coverage`.
- GitHub Actions for `96bab47` are in progress for CI and extension build.
- Production `/api/health` remains OK with DB ready; build metadata still reports `sha="unknown"` and `builtAt="unknown"`.
- Local tree is clean immediately after push.
- Next: poll checks while selecting the next non-auth-blocked improvement.

## 2026-07-01 04:28:29 CEST - Loop 3 Progress

- Starting health build metadata normalization.
- Dokploy build metadata still needs explicit build args/runtime env, but `/api/health` can be made more robust by treating empty/`unknown` values as absent and accepting common CI/deploy fallback variable names when present.

## 2026-07-01 04:31:58 CEST - Loop 3 Validation

- Added `readBuildInfo` helper for `/api/health`.
- Added web tests for explicit metadata preference, fallback source metadata, and invalid/unknown metadata handling.
- Documented fallback metadata names while keeping explicit `COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME` as the deployment contract.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (44 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (44 web tests + 14 extension VS Code tests)
- PASS: GitHub Actions for `96bab47 Add extension TrackerClient coverage` completed successfully.
- Next: inspect diff, commit, push, and poll deployment.

## 2026-07-01 04:33:25 CEST - Loop 3 Progress

- Committed and pushed health build metadata normalization as `16d5c67 Normalize health build metadata`.
- GitHub Actions for `16d5c67` are queued/in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"` until build metadata is configured/deployed.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with the next non-auth-blocked gap.

## 2026-07-01 04:35:33 CEST - Loop 3 Validation

- PASS: GitHub Actions for `16d5c67 Normalize health build metadata` completed successfully on both CI and extension build workflows.
- Extracted local disabled-auth identity and bearer token parsing into `authIdentity`.
- Updated ingest auth and Azure work-item bearer paths to reject empty/garbled bearer headers before attempting Azure auth.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (47 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (47 web tests + 14 extension VS Code tests)
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:36:47 CEST - Loop 3 Progress

- Committed and pushed auth identity/bearer parsing coverage as `80a3c2b Harden auth bearer parsing`.
- GitHub Actions for `80a3c2b` are queued/in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with route/API gaps that do not require live Azure login.

## 2026-07-01 04:38:40 CEST - Loop 3 Validation

- PASS: GitHub Actions for `80a3c2b Harden auth bearer parsing` completed successfully on both CI and extension build workflows.
- Hardened Azure profile/org membership parsing so malformed JSON returns null/false instead of throwing out of auth lookup.
- Added tests for Azure profile mapping, org membership by account name, org membership by account URI, malformed profile JSON, and malformed org-membership JSON.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (51 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (51 web tests + 14 extension VS Code tests)
- NOTE: final pass reran after trimming Azure string fields and fixing the lint-preferred logical fallback.
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:41:04 CEST - Loop 3 Progress

- Committed and pushed Azure profile/org lookup robustness as `d8473d2 Harden Azure profile parsing`.
- GitHub Actions for `d8473d2` are in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with additional route/API or extension gaps.

## 2026-07-01 04:42:46 CEST - Loop 3 Validation

- PASS: GitHub Actions for `d8473d2 Harden Azure profile parsing` completed successfully on both CI and extension build workflows.
- Hardened Azure token response parsing so malformed 200 responses and non-string access tokens map to typed `invalid_token_response` failures.
- Reused defensive token parsing for refresh-token responses so malformed refresh payloads fail closed.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (53 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (53 web tests + 14 extension VS Code tests)
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:43:53 CEST - Loop 3 Progress

- Committed and pushed Azure token response robustness as `97ce2f9 Harden Azure token responses`.
- GitHub Actions for `97ce2f9` are in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with the next testable gap.

## 2026-07-01 04:45:42 CEST - Loop 3 Validation

- PASS: GitHub Actions for `97ce2f9 Harden Azure token responses` completed successfully on both CI and extension build workflows.
- Added payload schema tests for optional chat request array defaults, prompt-token detail bounds, tool-call round bounds, tracker event payloads, required workspace id, and known event types.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (57 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (57 web tests + 14 extension VS Code tests)
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:47:05 CEST - Loop 3 Progress

- Committed and pushed payload schema coverage as `7871f09 Expand payload schema coverage`.
- GitHub Actions for `7871f09` are in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with additional high-value tests/fixes.

## 2026-07-01 04:49:43 CEST - Loop 3 Validation

- PASS: GitHub Actions for `7871f09 Expand payload schema coverage` completed successfully on both CI and extension build workflows.
- Added analytics tests for meaningful-request filtering, token/cost summaries, task summaries, developer-task fallback grouping, leaderboard ranking, model grouping, repository name fallbacks, and invalid activity timestamps.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (63 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (63 web tests + 14 extension VS Code tests)
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:50:56 CEST - Loop 3 Progress

- Committed and pushed analytics/dashboard grouping coverage as `6a28203 Add analytics coverage`.
- GitHub Actions for `6a28203` are queued/in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with the next high-value gap.

## 2026-07-01 04:52:27 CEST - Loop 3 Validation

- PASS: GitHub Actions for `6a28203 Add analytics coverage` completed successfully on both CI and extension build workflows.
- Extracted GitHub billing sync date parsing into a tested helper.
- Added tests for valid dates, leap day, missing/default dates, malformed dates, and impossible calendar dates.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (66 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (66 web tests + 14 extension VS Code tests)
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:53:39 CEST - Loop 3 Progress

- Committed and pushed GitHub billing date parser coverage as `b78a488 Add billing date coverage`.
- GitHub Actions for `b78a488` are in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with the next high-value gap.

## 2026-07-01 04:55:43 CEST - Loop 3 Validation

- PASS: GitHub Actions for `b78a488 Add billing date coverage` completed successfully on both CI and extension build workflows.
- Extracted current-session token stat calculation from `extension.ts` into `sessionTokenStats`.
- Added extension tests for null stats when no completed token totals exist and aggregation of the latest tokenized session with incomplete rows counted as lower-bound data.
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm test` (66 web tests + 16 extension VS Code tests)
- NOTE: final root test reran after replacing a floating-point artifact assertion with a rounded cost assertion.
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 04:57:57 CEST - Loop 3 Progress

- Committed and pushed extension current-session token stats coverage as `0ccdab6 Add extension session stats coverage`.
- GitHub Actions for `0ccdab6` are in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with the next high-value gap.

## 2026-07-01 04:59:26 CEST - Loop 3 Chrome Production Smoke

- PASS: Chrome loaded `https://copilot-tracker.antek.page/` with title `Copilot Tracker`.
- PASS: Chrome DOM check found `/api/auth/azure-devops` login links.
- PASS: Chrome auth navigation returned to `/?auth=failed&auth_code=invalid_client`.
- PASS: Chrome auth failure did not expose provider `error_description` details in the URL or body text.
- STALE/LIMITATION: Chrome did not show the newer `invalid_client` safe operator hint text, so production frontend still appears behind that UI change or serving a stale build; exact deployed commit is not provable while health metadata is unknown.
- Finalized Chrome tab cleanup.

## 2026-07-01 05:01:25 CEST - Loop 3 Validation

- PASS: GitHub Actions for `0ccdab6 Add extension session stats coverage` completed successfully on both CI and extension build workflows.
- Synced extension pricing aliases with the broader web pricing table for newer gpt-5.4, Claude, Gemini, raptor, and MAI aliases.
- Added extension pricing assertions for `gpt-5.4-nano` and `claude-haiku-4.5` so status bar cost estimates do not silently under-report those models.
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm test` (66 web tests + 16 extension VS Code tests)
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 05:02:28 CEST - Loop 3 Progress

- Committed and pushed extension pricing parity as `b4907ae Sync extension pricing aliases`.
- GitHub Actions for `b4907ae` are in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with the next high-value gap.

## 2026-07-01 05:03:57 CEST - Loop 3 Validation

- PASS: GitHub Actions for `b4907ae Sync extension pricing aliases` completed successfully on both CI and extension build workflows.
- Extracted WorkItemPicker search threshold and Azure DevOps error-message mapping into `workItemPicker` helpers.
- Added tests for multi-character text, digit-only IDs, blocked one-character non-ID searches, Azure DevOps auth/rate-limit errors, and fallback status messages.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (70 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (70 web tests + 16 extension VS Code tests)
- Next: inspect diff, commit, push, and continue.

## 2026-07-01 05:05:06 CEST - Loop 3 Progress

- Committed and pushed WorkItemPicker helper coverage as `91fb8d3 Add work item picker coverage`.
- GitHub Actions for `91fb8d3` are in progress.
- PASS: production `/api/health` returns OK with database ready.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start still redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI and continue with the next high-value gap.

## 2026-07-01 05:08:08 CEST - Loop 4 Start

- Synced context after compaction/resume.
- Git state: QA logs modified, `store.ts` modified, new `chatRequestMerge` helper and tests untracked.
- Extracted chat request batch dedupe/token normalization from the database store into a focused helper so ingest conflict behavior is directly testable.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (73 tests)
- Next: run broader validation, then commit and push if clean.

## 2026-07-01 05:10:10 CEST - Loop 4 Validation

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (73 web tests + 16 extension VS Code tests)
- PASS: GitHub Actions for `91fb8d3 Add work item picker coverage` completed successfully on both CI and extension build workflows.
- PASS: `git diff --check`
- Next: commit and push chat request merge coverage, then smoke production again.

## 2026-07-01 05:10:48 CEST - Loop 4 End

- Committed and pushed chat request merge coverage as `4e96bf2 Add chat request merge coverage`.
- GitHub Actions for `4e96bf2` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: poll CI while continuing with the next high-value issue.

## 2026-07-01 05:12:01 CEST - Loop 5 Start

- Started a focused web UX/model coverage slice for request session grouping and task display behavior.
- Target behavior: focused session sorts first, session rows sort by latest activity, common task calculation honors overrides, clear actions fall back to branch/default task, token capture labels distinguish total/partial/missing data, and session anchors remain stable.
- Current git state: post-push QA logs modified from Loop 4; no new code changes yet.
- Next: extract pure helpers from `request-sessions-grid.tsx`, add tests, and run focused validation.

## 2026-07-01 05:15:03 CEST - Loop 5 Validation

- Extracted request session grouping, task fallback, request cost label, token capture label, and session anchor helpers from the dashboard grid into `requestSessionsGridModel`.
- Added six web tests covering focused-session ordering, latest-activity ordering, manual override/clear fallback behavior, common task calculation, complete/partial/missing/unpriced labels, and stable DOM anchors.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (79 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (16 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (79 web tests + 16 extension VS Code tests)
- PASS: GitHub Actions for `4e96bf2 Add chat request merge coverage` completed successfully on both CI and extension build workflows.
- PASS: `git diff --check`
- Next: commit, push, production smoke, then continue.

## 2026-07-01 05:16:31 CEST - Loop 5 End

- Committed and pushed request session grid coverage as `12eb414 Add request session grid coverage`.
- GitHub Actions for `12eb414` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:17:29 CEST - Loop 6 Start

- Started a focused extension status-bar formatting coverage slice.
- Target behavior: status task text truncates predictably, hover token counts use readable number formatting, compact status token totals stay short, and estimated cost shows a lower-bound marker when session data is incomplete.
- Current git state: post-push QA logs modified from Loop 5; no new code changes yet.
- Next: extract private formatting helpers from `extension.ts`, add extension tests, and validate.

## 2026-07-01 05:19:20 CEST - Loop 6 Validation

- Extracted extension status bar formatting helpers from `extension.ts` into `statusFormatting`.
- Added extension tests for long-task truncation, standard/compact number formatting, small USD cost formatting, and lower-bound estimated cost text when token data is incomplete.
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (18 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (79 web tests + 18 extension VS Code tests)
- PASS: GitHub Actions for `12eb414 Add request session grid coverage` completed successfully on both CI and extension build workflows.
- PASS: `git diff --check`
- Next: commit, push, production smoke, then continue.

## 2026-07-01 05:20:43 CEST - Loop 6 End

- Committed and pushed extension status formatting coverage as `80f9933 Add extension status formatting coverage`.
- GitHub Actions for `80f9933` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:21:25 CEST - Loop 7 Start

- Started a focused web UX slice for GitHub username mapping feedback.
- Finding: the editor receives safe server validation errors, such as invalid GitHub username text, but currently renders only a generic `Failed` label.
- Current git state: post-push QA logs modified from Loop 6; no new code changes yet.
- Next: add a tested response-error helper and wire the editor to display the safe server message.

## 2026-07-01 05:22:42 CEST - Loop 7 Validation

- Added a tested GitHub-login mutation error-message helper that uses safe server `error` text and falls back for empty/non-JSON responses.
- Updated the GitHub username editor to show the safe server validation message instead of a generic `Failed` label.
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web test` (81 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (18 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 18 extension VS Code tests)
- PASS: GitHub Actions for `80f9933 Add extension status formatting coverage` completed successfully on both CI and extension build workflows.
- PASS: `git diff --check`
- Next: commit, push, production smoke, then continue.

## 2026-07-01 05:24:17 CEST - Loop 7 End

- Committed and pushed GitHub username mapping feedback as `21a41f5 Improve GitHub username error feedback`.
- GitHub Actions for `21a41f5` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:24:56 CEST - Loop 8 Start

- Started a focused extension URL coverage slice for the `openDashboard` command and status-token click path.
- Target behavior: dashboard URLs are rooted at `/dashboard`, optional `sessionId` query values are encoded, and invalid server URL values continue to fail through the existing validation.
- Current git state: post-push QA logs modified from Loop 7; no new code changes yet.
- Next: extract dashboard URL construction into a testable helper and validate.

## 2026-07-01 05:26:14 CEST - Loop 8 Validation

- Extracted extension dashboard URL construction into `trackerDashboardUrl`.
- Added extension tests for base dashboard URLs, encoded session ids, and invalid server URL rejection.
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (20 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 20 extension VS Code tests)
- PASS: GitHub Actions for `21a41f5 Improve GitHub username error feedback` completed successfully on both CI and extension build workflows.
- PASS: `git diff --check`
- Next: commit, push, production smoke, then continue.

## 2026-07-01 05:27:37 CEST - Loop 8 End

- Committed and pushed extension dashboard URL coverage as `88b55a0 Add extension dashboard URL coverage`.
- GitHub Actions for `88b55a0` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:29:01 CEST - Loop 9 Start

- Started a focused extension task-history coverage slice.
- Target behavior: stored task-history entries are validated/sorted, request timestamps resolve to the latest prior task assignment, cleared manual selections fall back to branch defaults, and invalid/no-history requests remain unresolved.
- Current git state: post-push QA logs modified from Loop 8; no new code changes yet.
- Next: extract pure task-history parsing/resolution helpers from `extension.ts`, add tests, and validate.

## 2026-07-01 05:31:21 CEST - Loop 9 Validation

- Extracted extension task-history parsing, source derivation, and request-time task resolver helpers into `taskHistory`.
- Added extension tests for valid history filtering/sorting, request-time historical attribution, cleared manual selection fallback to branch defaults, fallback context behavior, and no-timestamp/no-history requests.
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (23 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 23 extension VS Code tests)
- PASS: GitHub Actions for `88b55a0 Add extension dashboard URL coverage` completed successfully on both CI and extension build workflows.
- PASS: `git diff --check`
- Next: commit, push, production smoke, then continue.

## 2026-07-01 05:32:50 CEST - Loop 9 End

- Committed and pushed extension task history coverage as `439b174 Add extension task history coverage`.
- GitHub Actions for `439b174` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:34:02 CEST - Loop 10 Chrome Production Smoke

- PASS: GitHub Actions for `439b174 Add extension task history coverage` completed successfully on both CI and extension build workflows.
- PASS: Chrome loaded `https://copilot-tracker.antek.page/` with title `Copilot Tracker`.
- PASS: Chrome DOM check found two `/api/auth/azure-devops` login links.
- PASS: Chrome auth navigation returned to `/?auth=failed&auth_code=invalid_client`.
- PASS: Chrome auth failure did not expose provider `error_description` details in the URL/body.
- PASS: Chrome production now shows the safe `invalid_client` operator hint text about Azure app registration.
- LIMITATION: full signed-in Azure DevOps E2E remains blocked until production Azure OAuth client configuration is fixed.
- Next: continue with the next high-value gap.

## 2026-07-01 05:34:44 CEST - Loop 11 Start

- Started a small follow-up on the new task-history helper.
- Finding: `createTaskResolverFromHistory` should sort the history defensively instead of depending on callers to pass already sorted entries.
- Current git state: post-Chrome-smoke QA logs modified; no code changes yet.
- Next: sort defensively inside the helper and adjust tests to pass deliberately unsorted history.

## 2026-07-01 05:35:58 CEST - Loop 11 Validation

- Updated `createTaskResolverFromHistory` to sort a copy of history internally.
- Adjusted the request-time attribution test to pass deliberately unsorted history so the resolver contract is explicit.
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm --filter ./apps/extension test` (23 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm test` (81 web tests + 23 extension VS Code tests)
- PASS: `git diff --check`
- Next: commit, push, production smoke, then continue.

## 2026-07-01 05:37:20 CEST - Loop 11 End

- Committed and pushed defensive task-history sorting as `db1bd63 Harden task history resolution`.
- GitHub Actions for `db1bd63` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:37:50 CEST - Loop 12 Start

- Started extension packaging validation.
- Goal: verify `vsce package --no-dependencies` still works after extension refactors and tests.
- Current git state: post-push QA logs modified; no code changes pending.
- Next: run `pnpm --filter ./apps/extension package`, then clean up generated VSIX artifact if produced.

## 2026-07-01 05:38:31 CEST - Loop 12 End

- PASS: GitHub Actions for `db1bd63 Harden task history resolution` completed successfully on both CI and extension build workflows.
- PASS: `pnpm --filter ./apps/extension package` completed successfully and produced `copilot-tracker-0.0.1.vsix`.
- NOTE: `vsce` reported the existing package-context warning that no LICENSE file is present inside the extension package.
- Cleaned up the generated VSIX artifact so the worktree stays source-only.
- Next: continue with the next high-value gap.

## 2026-07-01 05:39:19 CEST - Loop 13 Start

- Started extension package license polish.
- Finding: root `LICENSE` exists, but `apps/extension` has no package-local LICENSE file, causing `vsce` to warn during packaging.
- Next: add matching MIT license text to the extension package context and rerun packaging.

## 2026-07-01 05:40:28 CEST - Loop 13 Validation

- Added `apps/extension/LICENSE` with the same MIT license text as the repository root.
- PASS: `pnpm --filter ./apps/extension package` completed successfully and included `LICENSE.txt` in the VSIX.
- PASS: the previous missing-license `vsce` warning is gone.
- CLEANUP: removed the generated `copilot-tracker-0.0.1.vsix` artifact from the worktree.
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `git diff --check`
- Next: commit, push, production smoke, then continue.

## 2026-07-01 05:41:43 CEST - Loop 13 End

- Committed and pushed extension package license as `ef40fc3 Add extension package license`.
- GitHub Actions for `ef40fc3` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:45:49 CEST - Loop 14 Start

- PASS: GitHub Actions for `ef40fc3 Add extension package license` completed successfully on both CI and extension build workflows.
- Production metadata gap reviewed again: repo docs and Docker/compose contracts already expose explicit build args/runtime env, and Dokploy public docs show build-time args are configurable but no official auto-injected commit SHA is guaranteed.
- Current git state: post-push QA logs modified; no source changes pending yet.
- Next: extract Azure DevOps session-token parsing/expiry helpers and cover refresh-token fallback/near-expiry behavior directly.

## 2026-07-01 05:47:33 CEST - Loop 14 Validation

- Extracted Azure DevOps session-token parsing and near-expiry checks into `authSessionTokens`.
- Added tests for token trimming, refresh-token fallback, missing/blank/non-string access-token rejection, invalid `expires_in` fallback, and 60-second near-expiry behavior.
- PASS: `pnpm --filter @copilot-tracker/web test` (86 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (86 web tests + 23 extension VS Code tests)
- PASS: `git diff --check`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 05:49:39 CEST - Loop 14 End

- Committed and pushed Azure session-token helper coverage as `c944583 Add Azure session token coverage`.
- GitHub Actions for `c944583` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:50:17 CEST - Loop 15 Start

- GitHub Actions for `c944583 Add Azure session token coverage`: extension build succeeded; CI still in progress.
- Current git state: post-push QA logs modified; no source changes pending yet.
- Finding: session-token encryption/decryption behavior is embedded in `store.ts`, and malformed encrypted token envelopes should be directly rejected and tested.
- Next: extract crypto helpers, preserve legacy plaintext-read behavior when a key exists, and add direct security regression coverage.

## 2026-07-01 05:52:27 CEST - Loop 15 Validation

- PASS: GitHub Actions for `c944583 Add Azure session token coverage` completed successfully on both CI and extension build workflows.
- Extracted session-token encryption/decryption into `sessionTokenCrypto`.
- Tightened encrypted token parsing to require exactly the expected envelope segments and valid base64url IV/tag/ciphertext sizes.
- Added tests for round-trip encryption, missing-key behavior, legacy plaintext reads with a configured key, malformed envelopes, and tampered ciphertext.
- PASS: `pnpm --filter @copilot-tracker/web test` (91 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (91 web tests + 23 extension VS Code tests)
- PASS: `git diff --check`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 05:54:00 CEST - Loop 15 End

- Committed and pushed session-token crypto hardening as `5b06f76 Harden session token crypto`.
- GitHub Actions for `5b06f76` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:54:26 CEST - Loop 16 Start

- Started reviewing API route payload handling while GitHub Actions for `5b06f76` run.
- Finding: GitHub-login PATCH routes parse non-object JSON bodies such as arrays or strings as `{}`, which can accidentally clear the stored GitHub login instead of rejecting invalid payload shape.
- Current git state: post-push QA logs modified; no source changes pending yet.
- Next: extract a shared object-payload reader, use it in both GitHub-login PATCH routes, and cover malformed/non-object inputs directly.

## 2026-07-01 05:56:57 CEST - Loop 16 Validation

- PASS: GitHub Actions for `5b06f76 Harden session token crypto` completed successfully on both CI and extension build workflows.
- Extracted `readJsonObjectPayload` and reused it in both user and admin GitHub-login PATCH routes.
- Changed non-object JSON bodies such as arrays, strings, and `null` from silent empty-object parsing to invalid payload handling.
- Added tests for valid JSON objects, malformed JSON, arrays, strings, and `null`.
- PASS: `pnpm --filter @copilot-tracker/web test` (94 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (94 web tests + 23 extension VS Code tests)
- PASS: `git diff --check`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 05:58:34 CEST - Loop 16 End

- Committed and pushed GitHub-login payload validation as `2906354 Validate GitHub login JSON payloads`.
- GitHub Actions for `2906354` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 05:59:00 CEST - Loop 17 Start

- Started Azure DevOps work-items API status mapping coverage while CI for `2906354` runs.
- Finding: the route preserves 401/403/429 from Azure DevOps and maps other upstream errors to 502, but that client-facing contract is private and untested.
- Current git state: post-push QA logs modified; no source changes pending yet.
- Next: extract the mapping helper, add direct tests, validate, and continue.

## 2026-07-01 06:00:11 CEST - Loop 17 Validation

- PASS: GitHub Actions for `2906354 Validate GitHub login JSON payloads` completed successfully on both CI and extension build workflows.
- Extracted `azureDevOpsWorkItemsClientStatus` from the work-items route.
- Added tests that preserve 401/403/429 for auth/rate-limit failures and map other upstream statuses to 502.
- PASS: `pnpm --filter @copilot-tracker/web test` (96 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (96 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- Next: commit, push, smoke production, and continue.
