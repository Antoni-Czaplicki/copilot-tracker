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

## 2026-07-01 06:01:44 CEST - Loop 17 End

- Committed and pushed Azure work-item status mapping coverage as `5447dd0 Add work item status mapping coverage`.
- GitHub Actions for `5447dd0` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 06:02:20 CEST - Loop 18 Start

- Started cron authorization coverage for the GitHub billing sync endpoint while CI for `5447dd0` runs.
- Finding: cron authorization compares the raw `Authorization` header string instead of reusing the hardened bearer parser.
- Current git state: post-push QA logs modified; no source changes pending yet.
- Next: extract `isCronAuthorized`, reuse bearer parsing, add direct tests, and validate.

## 2026-07-01 06:03:46 CEST - Loop 18 Validation

- PASS: GitHub Actions for `5447dd0 Add work item status mapping coverage` completed successfully on both CI and extension build workflows.
- Extracted `isCronAuthorized` for GitHub billing sync cron access.
- Reused the shared bearer parser so cron auth accepts canonical bearer casing/spacing while still failing closed for missing secrets, missing headers, malformed auth, wrong tokens, and extra token parts.
- PASS: `pnpm --filter @copilot-tracker/web test` (99 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (99 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:05:28 CEST - Loop 18 End

- Committed and pushed cron auth coverage as `5a921fe Add cron auth coverage`.
- GitHub Actions for `5a921fe` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 06:06:20 CEST - Loop 19 Start

- GitHub Actions for `5a921fe Add cron auth coverage`: extension build succeeded; CI still in progress.
- Current git state: post-push QA logs modified; no source changes pending yet.
- Finding: `authFailureHint` has stable operator hints for token-exchange/provider/callback branches that are not directly asserted.
- Next: add direct hint coverage and rerun validation.

## 2026-07-01 06:07:12 CEST - Loop 19 Validation

- PASS: GitHub Actions for `5a921fe Add cron auth coverage` completed successfully on both CI and extension build workflows.
- Added direct coverage for `invalid_grant`, `token_exchange_failed`, `provider_error`, and `callback_failed` auth hints.
- PASS: `pnpm --filter @copilot-tracker/web test` (100 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (100 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- Milestone: automated suites now run 123 tests total in the standard root command.
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:08:39 CEST - Loop 19 End

- Committed and pushed auth failure hint coverage as `93df1e2 Expand auth failure hint coverage`.
- GitHub Actions for `93df1e2` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- LIMITATION: production `/api/health` still reports `version.sha="unknown"` and `builtAt="unknown"`.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI.

## 2026-07-01 06:09:25 CEST - Loop 20 Start

- GitHub Actions for `93df1e2 Expand auth failure hint coverage`: extension build succeeded; CI still in progress.
- Current git state: post-push QA logs modified; no source changes pending yet.
- Finding: `/api/health` is dynamic but does not explicitly send a no-store header, which is useful for deploy freshness and readiness polling.
- Next: add a tiny response-init helper, cover status/cache behavior, and use it in the health route.

## 2026-07-01 06:10:29 CEST - Loop 20 Validation

- PASS: GitHub Actions for `93df1e2 Expand auth failure hint coverage` completed successfully on both CI and extension build workflows.
- Added `healthResponseInit` and wired `/api/health` responses to send `Cache-Control: no-store`.
- Added tests for ready 200 and unhealthy 503 response init behavior.
- PASS: `pnpm --filter @copilot-tracker/web test` (102 tests)
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (102 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:12:03 CEST - Loop 20 End

- Committed and pushed health response cache-control as `2456c3e Prevent health response caching`.
- GitHub Actions for `2456c3e` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no `Cache-Control` header, so the new no-store change has not been observed live yet.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Next: continue with the next high-value gap and poll CI/deploy freshness.

## 2026-07-01 06:13:48 CEST - Loop 21 Start

- PASS: GitHub Actions for `2456c3e Prevent health response caching` completed successfully on both CI and extension build workflows.
- Current git state: only nightly QA logs are modified locally.
- Production `/api/health` is still reachable with `ok=true` and `database.ok=true`, but still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- Next: scan env examples and docs for drift around production readiness/build metadata/auth behavior, then implement the next focused improvement.

## 2026-07-01 06:16:05 CEST - Loop 21 Validation

- Added non-secret build metadata placeholders to `apps/web/.env.example`.
- Updated `docs/deployment.md` so build metadata is part of the production runtime contract and `/api/health` smoke checks include `Cache-Control: no-store`.
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (102 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 07:18:13 CEST - Loop 34 End

- Committed and pushed extension work-item ID guard as `294cf69 Guard extension work item ids`.
- GitHub Actions for `294cf69` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start loop 35, poll CI/deploy, and continue improvement work.

## 2026-07-01 07:19:25 CEST - Loop 35 Start

- Previous pushed commit: `294cf69 Guard extension work item ids`; GitHub Actions were in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: poll CI, use Chrome to verify production homepage/auth failure behavior, and document results.

## 2026-07-01 07:22:11 CEST - Loop 35 Chrome Smoke

- PASS: GitHub Actions for `294cf69 Guard extension work item ids` completed successfully on both CI and extension build workflows.
- PASS: Chrome homepage smoke loaded `https://copilot-tracker.antek.page/` with title `Copilot Tracker`.
- PASS: Chrome homepage showed two visible `/api/auth/azure-devops` links labelled `Log in with Azure DevOps`.
- PASS: Chrome auth route navigation reached `https://copilot-tracker.antek.page/?auth=failed&auth_code=invalid_client`.
- PASS: Visible auth failure text is safe and helpful; it does not expose `AADSTS`, `error_description`, or `client_secret`.
- PARTIAL/STALE: production auth failure DOM has `role="alert"` count `0`, so the newer auth alert semantics are still not visibly deployed even though the text is safe.
- Source check confirms `apps/web/src/app/page.tsx` does include `role="alert"` and `aria-live="assertive"` for auth failure/misconfigured cards; the mismatch is treated as production freshness/deploy behavior.
- Browser tab was finalized/closed after smoke.
- Next: continue loop 35 by either finding a source-side fix for remaining deployment freshness evidence or selecting another focused local improvement.

## 2026-07-01 07:24:36 CEST - Loop 35 End

- Closed loop 35 as a Chrome smoke/documentation loop with no source code change.
- Current git state has only QA log updates from the smoke.
- Next: start loop 36 and inspect the next local code/test/UX gap.

## 2026-07-01 07:25:11 CEST - Loop 36 Start

- Previous pushed commit: `294cf69 Guard extension work item ids`; GitHub Actions are green.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production freshness/metadata.
- Next: scan TODOs/docs/loose validation surfaces and implement the next useful focused improvement.

## 2026-07-01 07:13:26 CEST - Loop 33 End

- Committed and pushed GitHub billing sync method authorization hardening as `784ef08 Restrict billing sync GET to cron`.
- GitHub Actions for `784ef08` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start loop 34, poll CI/deploy, and continue improvement work.

## 2026-07-01 07:14:24 CEST - Loop 34 Start

- Previous pushed commit: `784ef08 Restrict billing sync GET to cron`; GitHub Actions were in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: poll CI, inspect extension work-item result validation, and implement a parity fix if needed.

## 2026-07-01 07:16:06 CEST - Loop 34 Validation

- PASS: GitHub Actions for `784ef08 Restrict billing sync GET to cron` completed successfully on both CI and extension build workflows.
- FOUND: extension TrackerClient work-item result validation accepted any integer ID, while web/backend now reject non-positive or too-large Azure DevOps IDs.
- Tightened extension work-item validation to require a positive safe integer no larger than `2_147_483_647`.
- Expanded the malformed work-item search payload regression test to cover negative and too-large IDs.
- PASS: `pnpm --filter ./apps/extension test` (25 tests)
- PASS: `pnpm --filter ./apps/extension typecheck`
- PASS: `pnpm --filter ./apps/extension lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (120 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 07:08:02 CEST - Loop 32 End

- Committed and pushed Azure DevOps work-item upstream response hardening as `de00e83 Harden Azure work item responses`.
- GitHub Actions for `de00e83` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start loop 33, poll CI/deploy, and continue improvement work.

## 2026-07-01 07:08:53 CEST - Loop 33 Start

- Previous pushed commit: `de00e83 Harden Azure work item responses`; GitHub Actions were in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: poll CI, inspect admin/API mutation route boundaries, and implement the next focused improvement.

## 2026-07-01 07:11:24 CEST - Loop 33 Validation

- PASS: GitHub Actions for `de00e83 Harden Azure work item responses` completed successfully on both CI and extension build workflows.
- FOUND: GitHub billing sync still allowed signed-in admin GET requests to mutate state; the UI already uses POST and cron can keep using bearer-auth GET.
- Added `canRunBillingSync` helper and tests.
- Changed `/api/admin/github-billing/sync` so GET is cron-bearer only and POST allows cron bearer or admin fallback.
- Updated README API docs and billing sync instructions to distinguish cron GET from admin POST.
- PASS: `pnpm --filter @copilot-tracker/web test` (120 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (120 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 07:02:58 CEST - Loop 31 End

- Committed and pushed WorkItemPicker payload normalization as `f2ab551 Normalize work item picker results`.
- GitHub Actions for `f2ab551` are queued/in progress on CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start loop 32, poll CI/deploy, and continue improvement work.

## 2026-07-01 07:03:53 CEST - Loop 32 Start

- Previous pushed commit: `f2ab551 Normalize work item picker results`; GitHub Actions were queued/in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: poll CI, inspect remaining malformed-data edge cases, and implement the next focused improvement.

## 2026-07-01 07:06:07 CEST - Loop 32 Validation

- PASS: GitHub Actions for `f2ab551 Normalize work item picker results` completed successfully on both CI and extension build workflows.
- FOUND: Azure DevOps work-item client trusted successful upstream JSON and could leak malformed 200 responses as untyped failures.
- Added guarded successful JSON parsing that maps malformed upstream JSON to typed `azure_devops_bad_response` with status 502.
- Added shape guards for WIQL result ids and batch work-item payloads; invalid ids/items are filtered and missing result arrays fall back to empty results.
- Added tests for malformed WIQL JSON, malformed batch JSON, missing upstream result arrays, and invalid upstream ids.
- PASS: `pnpm --filter @copilot-tracker/web test` (117 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (117 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:57:57 CEST - Loop 30 End

- Committed and pushed successful-response count parsing hardening as `2b69124 Harden successful mutation counts`.
- GitHub Actions for `2b69124` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start loop 31, poll CI/deploy, and continue improvement work.

## 2026-07-01 06:58:48 CEST - Loop 31 Start

- Previous pushed commit: `2b69124 Harden successful mutation counts`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: poll CI, inspect remaining mutation/auth/UI edge cases, and implement the highest-value small fix found.

## 2026-07-01 07:01:13 CEST - Loop 31 Validation

- PASS: GitHub Actions for `2b69124 Harden successful mutation counts` completed successfully on both CI and extension build workflows.
- FOUND: WorkItemPicker trusted successful Azure DevOps work-item search payload shape and could try to render malformed options from a bad 200 response.
- Added `workItemsFromSearchPayload` to normalize successful search payloads into well-shaped picker items and filter malformed entries.
- Reused the normalizer in WorkItemPicker instead of casting raw JSON.
- Added tests for valid mapping plus malformed/null/non-array payloads and malformed entries.
- FIXED DURING VALIDATION: TypeScript needed an explicit numeric `id` guard and lint wanted a top-level type-only import; both were corrected.
- PASS: `pnpm --filter @copilot-tracker/web test` (114 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (114 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:17:32 CEST - Loop 21 End

- Committed and pushed deployment metadata docs alignment as `69a50f6 Align deployment metadata docs`.
- GitHub Actions for `69a50f6` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start the next loop and continue while CI/deploy catches up.

## 2026-07-01 06:18:01 CEST - Loop 22 Start

- Previous pushed commit: `69a50f6 Align deployment metadata docs`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: inspect remaining findings and route/component code for another focused regression or UX hardening slice.

## 2026-07-01 06:20:36 CEST - Loop 22 Validation

- PASS: GitHub Actions for `69a50f6 Align deployment metadata docs` completed successfully on both CI and extension build workflows.
- Added `readResponseError` / `responseErrorMessage` for shared safe parsing of JSON `{ error }` response bodies.
- Reused the helper in task editing, request session bulk/session mutation errors, GitHub billing sync, GitHub-login mapping, and WorkItemPicker Azure DevOps search error handling.
- Added tests for trimming server error strings and falling back on empty, non-string, array, malformed, or empty responses.
- PASS: `pnpm --filter @copilot-tracker/web test` (105 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (105 web tests + 23 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:22:09 CEST - Loop 22 End

- Committed and pushed shared frontend response-error handling as `fc5ccd1 Share frontend response error handling`.
- GitHub Actions for `fc5ccd1` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start the next loop and continue while CI/deploy catches up.

## 2026-07-01 06:22:34 CEST - Loop 23 Start

- Previous pushed commit: `fc5ccd1 Share frontend response error handling`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: inspect extension task search, auth, and context code for a small, meaningful regression test or hardening improvement.

## 2026-07-01 06:24:41 CEST - Loop 23 Validation

- PASS: GitHub Actions for `fc5ccd1 Share frontend response error handling` completed successfully on both CI and extension build workflows.
- Hardened extension `TrackerClient.searchWorkItems` to return only well-shaped work-item entries from successful server responses.
- Hardened extension server-error message parsing so blank JSON/string errors fall back to the HTTP status message.
- Added extension tests for malformed work-item payload filtering and blank error fallback.
- PASS: `pnpm --filter ./apps/extension test` (25 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (105 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:26:05 CEST - Loop 23 End

- Committed and pushed extension TrackerClient response hardening as `bab82eb Harden extension tracker responses`.
- GitHub Actions for `bab82eb` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start the next loop and continue while CI/deploy catches up.

## 2026-07-01 06:26:29 CEST - Loop 24 Start

- Previous pushed commit: `bab82eb Harden extension tracker responses`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: inspect web/backend route and utility edges for another small, testable hardening improvement.

## 2026-07-01 06:29:44 CEST - Loop 24 Validation

- PASS: GitHub Actions for `bab82eb Harden extension tracker responses` completed successfully on both CI and extension build workflows.
- Extracted pure GitHub billing response row normalization into `githubBillingRows.ts` to avoid env/database coupling in tests.
- Hardened billing normalization so malformed `usageItems` are ignored and invalid/missing `timePeriod` values fall back to the requested sync date.
- Added tests for valid usage-row mapping and malformed response tolerance.
- FIXED DURING VALIDATION: the first web test run failed because the test imported the env-backed billing module; the helper was moved to a pure module and tests passed.
- FIXED DURING VALIDATION: the first typecheck run flagged an `unknown` integer guard; made the `typeof value === "number"` narrowing explicit.
- PASS: `pnpm --filter @copilot-tracker/web test` (107 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (107 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:31:23 CEST - Loop 24 End

- Committed and pushed GitHub billing response parsing hardening as `36b506e Harden GitHub billing response parsing`.
- GitHub Actions for `36b506e` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start the next loop and continue while CI/deploy catches up.

## 2026-07-01 06:33:17 CEST - Loop 25 Chrome Production Smoke

- PASS: Chrome loaded `https://copilot-tracker.antek.page/` with title `Copilot Tracker`.
- PASS: Chrome found visible plain login anchors with `href="/api/auth/azure-devops"` and text `Log in with Azure DevOps`.
- BLOCKED/EXPECTED: navigating to the live auth route returned to `/?auth=failed&auth_code=invalid_client`.
- PASS: the rendered page contains the stable `invalid_client` code and generic Azure app-registration guidance.
- PASS: the rendered failure surface did not include provider `AADSTS`, `error_description`, or client-secret values.
- CLEANUP: Chrome test tab finalized/closed.
- Next: continue with the next code/test improvement while polling CI and production freshness.

## 2026-07-01 06:34:09 CEST - Loop 26 Start

- PASS: GitHub Actions for `36b506e Harden GitHub billing response parsing` completed successfully on both CI and extension build workflows.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Finding: GitHub billing response date parsing rejects malformed month/day values but still accepts impossible calendar dates such as February 31.
- Next: add an actual calendar-date guard and regression coverage.

## 2026-07-01 06:35:33 CEST - Loop 26 Validation

- Added UTC calendar-date validation for GitHub billing response `timePeriod` values.
- Added regression coverage for impossible dates falling back to the requested sync date.
- PASS: `pnpm --filter @copilot-tracker/web test` (108 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (108 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:37:03 CEST - Loop 26 End

- Committed and pushed GitHub billing impossible-date guard as `8256b76 Reject impossible GitHub billing dates`.
- GitHub Actions for `8256b76` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start the next loop and continue while CI/deploy catches up.

## 2026-07-01 06:37:31 CEST - Loop 27 Start

- Previous pushed commit: `8256b76 Reject impossible GitHub billing dates`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: inspect ingest/update route helper behavior for a small, meaningful regression test or hardening improvement.

## 2026-07-01 06:40:02 CEST - Loop 27 Validation

- Added shared `readJsonPayload` helper and refactored `readJsonObjectPayload` through it.
- Reused `readJsonPayload` in `/api/events`, `/api/chat-requests/batch`, `/api/chat-requests/bulk`, and `/api/chat-requests/[requestRecordId]`.
- Added coverage that `readJsonPayload` preserves parsed arrays/scalars for schema validation and returns `null` for malformed JSON.
- FIXED DURING VALIDATION: lint warned that `unknown | null` was redundant; changed the return type to `unknown`.
- PASS: `pnpm --filter @copilot-tracker/web test` (109 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (109 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:41:59 CEST - Loop 27 End

- PASS: GitHub Actions for `8256b76 Reject impossible GitHub billing dates` completed successfully on both CI and extension build workflows.
- Committed and pushed shared route JSON payload parsing as `72438f5 Share route JSON payload parsing`.
- GitHub Actions for `72438f5` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start the next loop and continue while CI/deploy catches up.

## 2026-07-01 06:42:29 CEST - Loop 28 Start

- Previous pushed commit: `72438f5 Share route JSON payload parsing`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Chrome smoke found safe `invalid_client` guidance in rendered text, but the first compact DOM summary did not surface it prominently.
- Next: inspect homepage/auth failure rendering for a small UX polish improvement.

## 2026-07-01 06:44:23 CEST - Loop 28 Validation

- PASS: GitHub Actions for `72438f5 Share route JSON payload parsing` completed successfully on both CI and extension build workflows.
- Updated unauthenticated homepage auth failure/misconfigured cards to render as `role="alert"` with assertive live regions.
- Added clearer destructive visual treatment and monospace display for the stable auth error code.
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (109 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:45:49 CEST - Loop 28 End

- Committed and pushed auth failure alert UX polish as `a12045b Improve auth failure alert UX`.
- GitHub Actions for `a12045b` are in progress.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start the next loop and continue while CI/deploy catches up.

## 2026-07-01 06:46:20 CEST - Loop 29 Start

- Previous pushed commit: `a12045b Improve auth failure alert UX`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: inspect package scripts/metadata and run dependency/release readiness checks.

## 2026-07-01 06:50:51 CEST - Loop 29 Validation

- PASS: GitHub Actions for `a12045b Improve auth failure alert UX` completed successfully on both CI and extension build workflows.
- Reviewed package metadata/workflows; extension metadata includes publisher, repository, homepage, bugs URL, license, README, changelog, and VSIX packaging workflow.
- FOUND: `pnpm audit --prod --audit-level moderate` reported one moderate production dependency issue: vulnerable `postcss <8.5.10` through Next.
- Initial package-level override attempt did not affect pnpm 11; pnpm reported that `pnpm.overrides` in `package.json` is ignored and the existing top-level `overrides` were not changing the dependency graph.
- FIXED: moved security overrides into `pnpm-workspace.yaml` and refreshed `pnpm-lock.yaml`; this also made the existing `diff` and `serialize-javascript` pins enforceable.
- PASS: `pnpm audit --prod --audit-level moderate` reports no known vulnerabilities.
- PASS: `pnpm why postcss --prod` reports a single patched `postcss@8.5.15` used by Next and shadcn.
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (109 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension package`; generated VSIX removed after verification.
- Next: commit, push, smoke production, and continue.

## 2026-07-01 06:53:03 CEST - Loop 29 End

- Committed and pushed dependency override fix as `f76379a Enforce pnpm security overrides`.
- GitHub Actions for `f76379a` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production `/api/health` still reports `version.sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- PASS: sanitized production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- Current git state after push: clean.
- Next: start loop 30, poll CI/deploy, and continue improvement work.

## 2026-07-01 06:53:47 CEST - Loop 30 Start

- Previous pushed commit: `f76379a Enforce pnpm security overrides`; GitHub Actions were still in progress at the prior poll.
- Current blocker remains external Azure OAuth `invalid_client`, unavailable Docker daemon, and unproven production commit metadata/cache-header freshness.
- Next: poll CI, inspect deployment health implementation, and choose the next focused UX/test hardening slice.

## 2026-07-01 06:56:10 CEST - Loop 30 Validation

- PASS: GitHub Actions for `f76379a Enforce pnpm security overrides` completed successfully on both CI and extension build workflows.
- Confirmed local health route code still sets `cache-control: no-store`; production missing header remains a deployment/proxy/freshness limitation rather than an obvious source-code miss.
- FOUND: admin billing sync parsed success JSON directly, so an empty or malformed successful response could show a sync failure after the operation succeeded.
- Added shared `readNumericResponseField` helper and tests for finite counts plus missing, malformed, empty, array, null, and non-numeric payloads.
- Reused the helper in admin billing sync and request session mutation result parsing.
- PASS: `pnpm --filter @copilot-tracker/web test` (112 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (112 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, and continue.

## 2026-07-01 07:28:29 CEST - Loop 36 Implementation

- Re-synced git state; only nightly QA notes were dirty before this loop's source edit.
- Targeted boundary scan found no TODO/FIXME backlog, then focused on auth/API JSON and query-param handling.
- Chosen improvement: preserve sanitized Azure OAuth provider error codes in callback redirects instead of collapsing them all to `provider_error`.
- Added route coverage for safe provider-code preservation, truncation/control-character sanitization, blank unsafe fallback, and a safe `access_denied` hint.

## 2026-07-01 07:31:12 CEST - Loop 36 Validation

- PASS: `pnpm --filter @copilot-tracker/web test` (122 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, poll CI, and continue.

## 2026-07-01 07:31:56 CEST - Loop 36 Push/Poll

- Committed and pushed provider-code preservation as `4538973 Preserve Azure provider auth codes`.
- GitHub Actions for `4538973` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: production Azure OAuth start redirects to Microsoft with PKCE `S256`, state, client id, and required Azure DevOps scopes.
- STALE/LIMITATION: direct provider-error callback still redirects with `auth_code=provider_error`, so production has not yet picked up the new `access_denied` preservation behavior.
- Next: poll CI/deploy and continue with the next local scan if deploy remains delayed.

## 2026-07-01 07:32:58 CEST - Loop 37 Start

- Previous pushed commit: `4538973 Preserve Azure provider auth codes`; GitHub Actions were still in progress at the prior poll.
- Production callback behavior had not yet picked up `4538973`.
- Next: align web WorkItemPicker successful result ID filtering with the backend and extension Azure DevOps ID bounds.

## 2026-07-01 07:34:22 CEST - Loop 37 Validation

- PASS: GitHub Actions for `4538973 Preserve Azure provider auth codes` completed successfully on both CI and Build extension workflows.
- STALE/LIMITATION: production provider-error callback still returns `auth_code=provider_error`, so `4538973` is not live yet.
- Added web WorkItemPicker ID-bound filtering for non-positive and above-`2_147_483_647` successful result IDs.
- PASS: `pnpm --filter @copilot-tracker/web test` (122 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 25 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- Next: commit, push, smoke production, poll CI, and continue.

## 2026-07-01 07:35:57 CEST - Loop 37 End / Loop 38 Start

- Committed and pushed web picker ID-bound parity as `27e58c3 Guard web work item ids`.
- GitHub Actions for `27e58c3` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production provider-error callback still redirects with `auth_code=provider_error`, so the deployed app is still behind `4538973` or serving stale behavior.
- Current git state after push was clean before recording this status update.
- Next: scan the remaining extension/web/API surfaces for another small reliability or UX improvement while CI/deploy runs.

## 2026-07-01 07:37:59 CEST - Loop 38 Validation

- PASS: GitHub Actions for `27e58c3 Guard web work item ids` completed successfully on both CI and Build extension workflows.
- Added extension `TrackerClient` regression coverage for long JSON server errors and reused the existing 240-character cap for JSON `{ error }` bodies.
- PASS: `pnpm --filter ./apps/extension test` (26 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: production `/api/health` remains HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production provider-error callback still redirects with `auth_code=provider_error`.
- Next: commit, push, smoke production, poll CI, and continue.

## 2026-07-01 07:39:38 CEST - Loop 38 End / Loop 39 Start

- Committed and pushed extension server-error message cap as `625a202 Cap extension server error messages`.
- GitHub Actions for `625a202` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production provider-error callback still redirects with `auth_code=provider_error`.
- Current git state after push was clean before recording this status update.
- Next: one more high-value docs/API/UI scan while CI/deploy catches up.

## 2026-07-01 07:40:41 CEST - Loop 39 Validation

- PASS: GitHub Actions for `625a202 Cap extension server error messages` completed successfully on both CI and Build extension workflows.
- STALE/LIMITATION: production provider-error callback still redirects with `auth_code=provider_error`.
- Clarified `docs/deployment.md` so production smoke checks require sanitized provider `auth_code` preservation while continuing to forbid reflected provider descriptions.
- PASS: `git diff --check`
- Next: commit, push, smoke production, and poll CI/deploy.

## 2026-07-01 07:42:13 CEST - Loop 39 End / Loop 40 Start

- Committed and pushed auth callback smoke doc clarification as `29cf02d Clarify auth callback smoke docs`.
- GitHub Actions for `29cf02d` are in progress on both CI and Build extension workflows.
- PASS: production `/api/health` returns HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production provider-error callback still redirects with `auth_code=provider_error`.
- Current git state after push was clean before recording this status update.
- Next: final low-risk documentation/test coverage scan before morning handoff.

## 2026-07-01 07:43:08 CEST - Loop 40 Poll

- PASS: `pnpm audit --prod --audit-level moderate` reports no known vulnerabilities.
- PASS: `pnpm why postcss --prod` reports one patched `postcss@8.5.15` version through Next and shadcn.
- PASS: GitHub Actions Build extension workflow for `29cf02d Clarify auth callback smoke docs` completed successfully.
- IN PROGRESS: GitHub Actions CI workflow for `29cf02d` is still running.
- PASS: production `/api/health` remains HTTP 200 with `ok=true` and `database.ok=true`.
- STALE/LIMITATION: production provider-error callback still redirects with `auth_code=provider_error`; `error_description` remains hidden.

## 2026-07-01 07:44:59 CEST - Loop 40 Final Handoff

- PASS: GitHub Actions CI workflow for `29cf02d Clarify auth callback smoke docs` completed successfully.
- PASS: final production smoke health returned HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: final production Azure OAuth start redirect goes to Microsoft with PKCE `S256`, state, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- PASS/PARTIAL: direct provider-error callback hides `error_description`, but still returns stale `auth_code=provider_error` instead of the newer preserved `access_denied` code.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- Documented test cases now reach `DOC-278`.
- Next: commit final QA log updates and wait for that log-only commit's CI.

## 2026-07-01 07:59:51 CEST - Loop 40 Final Poll

- PASS: final QA log commit `22d34f0 Record final nightly QA status` completed successfully on both CI and Build extension workflows.
- PASS: final production `/api/health` remains HTTP 200 with `ok=true` and `database.ok=true`.
- PASS: final production Azure OAuth start redirect goes to Microsoft with PKCE `S256`, state, and required `offline_access`, `vso.profile`, and `vso.work` scopes.
- PASS/PARTIAL: direct provider-error callback hides `error_description`, but still returns stale `auth_code=provider_error` instead of the newer preserved `access_denied` code.
- STALE/LIMITATION: production `/api/health` still reports `sha="unknown"`, `builtAt="unknown"`, and no visible `Cache-Control` header.
- Current HEAD observed as `22d34f0`; worktree was clean before this status correction.

## 2026-07-01 08:06:15 CEST - Loop 41 Validation

- PASS: latest pushed commit `cf5ade1 Correct final nightly QA poll logs` completed successfully on both CI and Build extension workflows.
- Added `scripts/smoke-production.mjs` and `pnpm smoke:production` as a strict deploy smoke verifier for health, build metadata, cache control, Azure PKCE/scopes, and provider-error callback behavior.
- Added `--allow-known-stale` mode so the current production deployment can still be monitored while freshness gaps are reported as warnings.
- PASS: `node --check scripts/smoke-production.mjs`
- EXPECTED FAIL: `pnpm smoke:production` fails strict mode on current production because build metadata/cache header/provider-code freshness are stale.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale` exits successfully while warning on the known freshness gaps.
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (122 web tests + 26 extension VS Code tests)
- Next: commit, push, smoke production, poll CI, and continue if needed.

## 2026-07-01 08:14:36 CEST - Loop 42 Validation

- PASS: latest pushed commit `1384cfe Add production smoke verifier` completed successfully on both CI and Build extension workflows.
- Added `scripts/smoke-production.test.mjs` with local HTTP-server coverage for fresh deployment success, strict stale deployment failure, and known-stale warning mode.
- Wired `pnpm test:smoke` into the root `pnpm test` flow so CI exercises the smoke verifier without calling production.
- PASS: `pnpm test:smoke` (3 tests)
- PASS: `node --check scripts/smoke-production.test.mjs`
- PASS: `git diff --check`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (3 smoke tests + 122 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale` against production
- Next: commit, push, smoke production, poll CI, and continue if needed.

## 2026-07-01 08:21:29 CEST - Loop 43 Start

- Latest pushed commit before this loop: `71783ad Test production smoke verifier`; working tree contains only the intended health freshness header source changes plus nightly QA log updates.
- Focus: source-side hardening for `/api/health` freshness headers, including Next route header configuration for browser/CDN/proxy cache bypass.
- Remaining blockers/risks carried forward: production Azure login returns `invalid_client`; Docker daemon unavailable; deployed build metadata remains `unknown`; production still appears stale for provider-error callback behavior.
- Next: rerun full validation, update durable QA ledgers, commit/push, poll GitHub Actions, and run production smoke in known-stale mode.

## 2026-07-01 08:23:45 CEST - Loop 43 Validation

- Added expanded shared `/api/health` freshness headers: `cache-control`, `cdn-cache-control`, `expires`, `pragma`, and `surrogate-control`.
- Configured Next to emit the shared health freshness headers for `/api/health`.
- Added regression coverage for the expanded health header contract; web tests now report 123 tests.
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (3 smoke tests + 123 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm smoke:production -- --allow-known-stale`
- PASS: `git diff --check`
- STILL KNOWN-STALE: production health metadata/cache header and provider-error callback behavior remain stale until deployment proves freshness.
- Next: commit, push, poll GitHub Actions, and re-run production smoke.

## 2026-07-01 08:27:08 CEST - Loop 43 Poll

- PUSHED: `ea2685e Harden health freshness headers`.
- PASS: GitHub Actions CI for `ea2685e` completed successfully.
- PASS: GitHub Actions Build extension for `ea2685e` completed successfully.
- PASS/WARN: post-CI `pnpm smoke:production -- --allow-known-stale` still passes with the known freshness warnings.
- STALE/LIMITATION: production still reports `sha="unknown"`, `builtAt="unknown"`, missing visible `Cache-Control`, and provider-error callback `auth_code=provider_error`.

## 2026-07-01 08:58:49 CEST - Loop 44 Start/Validation

- User reports VPS/Dokploy issue was fixed; future VPS incidents should use the Termius app with saved SSH/Dokploy access instead of guessing from app behavior alone.
- PASS: latest pushed commit `0bc8f68 Record health header QA poll` is green on CI and Build extension.
- PASS: production smoke hard gates for health, Azure auth start, provider-error callback, and cache header now pass.
- PASS: production auth failure HTML includes `role="alert"` and safe `invalid_client` text; no `AADSTS`, `error_description`, or `client_secret` matches were returned by the HTML probe.
- LIMITATION: strict production smoke still fails because `/api/health` build metadata is `unknown`.
- Added `--expect-sha` to `scripts/smoke-production.mjs` so exact deployed commit checks can be enforced once metadata is configured.
- PASS: `node --check scripts/smoke-production.mjs`
- PASS: `pnpm test:smoke` (7 tests)
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0bc8f68`
- PASS: `git diff --check`
- Next: run broad validation, commit/push, poll CI, and then continue with Chrome signed-in production E2E.

## 2026-07-01 09:01:38 CEST - Loop 44 Broad Validation

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (7 smoke tests + 123 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0bc8f68`
- PASS: `git diff --check`
- Next: commit and push exact-SHA smoke verifier and poll CI.

## 2026-07-01 09:04:54 CEST - Loop 44 Poll

- PUSHED: `d948d06 Verify deployed commit in production smoke`.
- PASS: GitHub Actions CI for `d948d06` completed successfully.
- PASS: GitHub Actions Build extension for `d948d06` completed successfully.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha d948d06` passed against production.
- LIMITATION: production still reports unknown health build metadata, so exact deployed commit proof remains unavailable until Dokploy/runtime metadata is configured.
- Next: continue with Chrome signed-in production E2E and/or Termius/Dokploy metadata configuration.

## 2026-07-01 09:14:03 CEST - Loop 45 Validation

- PASS: latest pushed commit `7d88d23 Record exact smoke QA poll` completed successfully on both GitHub Actions workflows.
- PASS/WARN: production smoke still passes in known-stale exact-SHA mode; remaining smoke warnings are build metadata only.
- CONFIRMED: no Dokploy MCP appears exposed in this Codex session; use Chrome for Dokploy UI/logs and Termius/SSH for host-level fixes.
- Added redacted structured Azure OAuth callback diagnostics with `auth_ref` correlation.
- Public failure redirects/pages now carry safe `auth_code` plus `auth_ref`; provider details remain server-log-only.
- PASS: `pnpm --filter @copilot-tracker/web test` (125 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (7 smoke tests + 125 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 7d88d23`
- PASS: `git diff --check`
- Next: commit/push, poll CI, deploy, and verify the real Chrome `invalid_client` flow logs a matching Dokploy `authRef`.

## 2026-07-01 09:19:57 CEST - Loop 45 Smoke Follow-Up

- PASS: `0d1bab4 Add redacted auth diagnostics` completed successfully on both GitHub Actions workflows.
- Added production smoke assertion for provider-error callback `auth_ref`.
- PASS: `node --check scripts/smoke-production.mjs`
- PASS: `pnpm test:smoke` (7 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (7 smoke tests + 125 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0d1bab4` now warns that production lacks `auth_ref` until deploy catches up.
- PASS: `git diff --check`
- Next: commit/push the smoke assertion, poll CI, then verify production `auth_ref` after deployment.

## 2026-07-01 09:26:34 CEST - Loop 45 Auth Diagnostics Verification

- PASS: `615f097 Check auth references in production smoke` completed successfully on GitHub Actions CI and Build extension workflows.
- PASS: production direct provider-error smoke now includes a diagnostic `auth_ref`.
- PASS: real Chrome Azure login retry exposes only safe client data: `auth_code=invalid_client` and an opaque `auth_ref`.
- PASS: Dokploy UI logs contain a matching redacted `azure_oauth_callback_failed` event for the `auth_ref`.
- DIAGNOSIS: the detailed server-side Azure error is `AADSTS700025`, meaning Azure treats the client as public while the backend presents a client secret. Fix Azure app registration/client type for the confidential backend flow, or intentionally migrate to public-client PKCE without a secret.
- CONFIRMED: no Dokploy MCP is exposed through current tool discovery; use Chrome Dokploy UI for log lookup and Termius/SSH for VPS/Dokploy host fixes.
- Next: commit this log-only operator handoff, then continue with the Azure config/build metadata follow-up.

## 2026-07-01 09:29:26 CEST - Loop 46 Start

- PASS: `801c672 Record auth diagnostics deploy verification` completed successfully on GitHub Actions CI and Build extension workflows.
- Reviewed `readBuildInfo`, Dockerfile build args, compose env mapping, and deployment docs.
- Confirmed source already supports explicit build metadata and common fallback env names; live production remains `unknown` because Dokploy is not passing the required values.
- Started a docs-only clarification for Dokploy Build Time Arguments/runtime env setup and the current Azure web/confidential-client requirement.
- PASS: `git diff --check`

## 2026-07-01 09:36:54 CEST - Loop 47 Azure Portal Diagnosis

- PASS: `7137e29 Clarify Dokploy and Azure auth setup` completed successfully on GitHub Actions CI and Build extension workflows.
- PASS/WARN: production smoke for `7137e29` passed all hard gates and still warns only on unknown build metadata/SHA.
- Opened Microsoft Entra App registrations in the existing signed-in Chrome profile and inspected the Copilot Tracker app registration without recording IDs or secrets.
- CONFIRMED ROOT CAUSE: the Authentication redirect platform is `Single-page application`, not `Web`, so Azure treats the callback as public-client while this backend sends a client secret.
- BLOCKED FOR LIVE FIX: redirect URI/platform edit controls are disabled in the current signed-in context; the account can inspect the registration but is not listed as an owner.
- Next: operator with app-registration edit rights should move/add the production callback redirect URI under `Web`, then rerun Chrome login and signed-in dashboard/work-item E2E.

## 2026-07-01 10:23:13 CEST - Loop 48 Start/Profile Diagnostics

- User reports the Azure Web redirect fix is done and provided a screenshot showing the callback under `Web`.
- PASS: repository is clean at `e614348`; latest GitHub Actions CI and Build extension workflows are green.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha e614348` passed all hard gates, warning only on unknown build metadata/SHA.
- PASS/PROGRESS: real Chrome production login no longer returns `invalid_client`; it now reaches `auth_code=profile_or_org_check_failed`, so token exchange is no longer the blocker.
- ADDED LOCALLY: redacted server-side profile/org diagnostics for `profile_or_org_check_failed`, including profile/org status/result fields and account count.
- PASS: `pnpm --filter @copilot-tracker/web test` (128 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`

## 2026-07-01 10:26:26 CEST - Loop 48 Broad Validation

- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm test` (7 smoke tests + 128 web tests + 26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: `pnpm --filter ./apps/extension compile`
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha e614348`
- PASS: `git diff --check`
- Next: commit/push profile/org diagnostics, poll CI, wait for deploy, and retry Chrome login to collect the new redacted Dokploy diagnostic fields.

## 2026-07-01 10:32:28 CEST - Loop 48 Deploy Verification

- PUSHED: `7020999 Add profile org auth diagnostics`.
- PASS: GitHub Actions CI for `7020999` completed successfully.
- PASS: GitHub Actions Build extension for `7020999` completed successfully.
- PASS: Dokploy deployments list shows `7020999` deployed successfully.
- PASS/WARN: post-deploy `pnpm smoke:production -- --allow-known-stale --expect-sha 7020999` passed all hard gates, warning only on unknown build metadata/SHA.
- PASS: fresh real Chrome login returned safe `auth_code=profile_or_org_check_failed` with `auth_ref`.
- PASS: matching Dokploy log contains deployed redacted diagnostics: profile lookup OK, profile HTTP 200, profile id present, org membership HTTP 200, one account returned, organization membership not matched.
- Next: fix configured Azure DevOps org value or signed-in user's organization membership/visibility, then rerun Chrome signed-in dashboard and Azure work-item E2E.

## 2026-07-01 10:34:40 CEST - Loop 49 Start

- PASS: local repository is on `main`; `20094a0 Record deployed profile org diagnosis` exists locally and was pushed to `origin/main`.
- PASS: production homepage loads in real Chrome with the visible Azure DevOps login link.
- FAIL/EXPECTED: clicking the main production login link still returns `auth_code=profile_or_org_check_failed` with a safe `auth_ref`.
- PASS: matching Dokploy log for the fresh `auth_ref` shows profile lookup OK/status 200/profile id present and org membership request OK/status 200 with one account returned but no configured-org match.
- HYPOTHESIS: production may be using an old-style Azure DevOps organization URL in `AZURE_DEVOPS_ORG`; source normalized `https://dev.azure.com/<org>` but not `https://<org>.visualstudio.com`.

## 2026-07-01 10:38:36 CEST - Loop 49 Validation

- ADDED: `normalizeAzureDevOpsOrg` now accepts org slugs, `https://dev.azure.com/<org>`, and old-style `https://<org>.visualstudio.com` values.
- ADDED: focused config tests for all supported org forms.
- UPDATED: README and deployment docs now document accepted `AZURE_DEVOPS_ORG` formats.
- PASS: `pnpm --filter @copilot-tracker/web test` (131 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (26 extension VS Code tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: clean rerun of `pnpm test` (7 smoke tests + 131 web tests + 26 extension VS Code tests)
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 20094a0` passed hard gates; warnings remain limited to unknown build metadata/SHA.
- PASS: `git diff --check`
- Next: commit/push normalization, poll CI/deploy, then retry production Chrome auth.

## 2026-07-01 10:45:21 CEST - Loop 49 Deploy Verification

- PUSHED: `9a3acb1 Normalize Azure DevOps org URLs`.
- PASS: GitHub Actions CI and Build extension completed successfully for `9a3acb1`.
- PASS: Dokploy deployments list shows `9a3acb1` done.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 9a3acb1` passed all hard gates; warnings remain limited to unknown build metadata/SHA.
- FAIL/EXPECTED: real Chrome production login still returns `auth_code=profile_or_org_check_failed` with safe `auth_ref`.
- PASS: matching Dokploy log, also pasted by the user, still shows profile OK/status 200/profile id present, account count 1, and org membership not matched. The old URL-form normalization was not sufficient.

## 2026-07-01 10:53:27 CEST - Loop 50 Direct Org Probe

- ADDED: after account-name membership matching fails, auth now probes the configured Azure DevOps org WIQL endpoint directly with the signed-in token.
- SAFETY: the probe only accepts a successful WIQL JSON payload with a `workItems` array; failures or malformed responses remain fail-closed.
- ADDED: redacted `orgAccessProbeResult` and `orgAccessProbeStatus` fields to server-side auth failure logs.
- ADDED: tests for failed probe diagnostics and probe-based user acceptance when account names do not match.
- PASS: `pnpm --filter @copilot-tracker/web test` (132 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test` (26 tests)
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
- PASS: clean rerun of `pnpm test` (7 smoke tests + 132 web tests + 26 extension VS Code tests)
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 9a3acb1` passed hard gates; warnings remain limited to unknown build metadata/SHA.
- PASS: `git diff --check`
- Next: commit/push direct configured-org probe, poll CI/deploy, then retry production Chrome auth.

## 2026-07-01 11:04:24 CEST - Loop 50 Deploy Verification

- PUSHED: `01650a4 Probe configured Azure DevOps org access`.
- PASS: GitHub Actions CI and Build extension completed successfully for `01650a4`.
- PASS: Dokploy deployments list shows `01650a4` done.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 01650a4` passed all hard gates; warnings remain limited to unknown build metadata/SHA.
- FAIL/EXPECTED: real Chrome production login still returns `auth_code=profile_or_org_check_failed` with safe `auth_ref`.
- PASS: matching Dokploy log now includes direct configured-org probe diagnostics.
- DIAGNOSIS: profile lookup succeeds, profile id is present, accounts API succeeds with one returned account, account-list match fails, and configured-org WIQL probe returns HTTP 401. Remaining auth work is production Azure DevOps org/user access/consent configuration, not an app-code parser or redirect issue.

## 2026-07-01 11:32:17 CEST - Loop 51 Start

- PASS: repository is clean on `main` at `1506101 Record configured org access diagnosis`.
- CONTEXT: production runtime Azure DevOps org config was corrected in Dokploy using the user-provided accessible org value, without recording the value in repo logs.
- CONTEXT: production runtime `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` was added in Dokploy, without recording the value, so newly created web sessions can persist Azure DevOps access/refresh tokens.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 1506101` passed all hard gates; warnings remain limited to unknown build metadata/SHA.
- Next: clear the old Chrome web session, create a fresh Azure login session, and test the signed-in work-items route.

## 2026-07-01 11:36:00 CEST - Loop 51 Auth Retest

- PASS: real Chrome production dashboard showed a signed-in session before logout.
- PASS: app logout via `/api/auth/logout` returned to the public homepage.
- PASS: following the visible `Log in with Azure DevOps` link completed Microsoft/Azure auth and landed on `/dashboard`.
- PASS: signed-in `/api/azure-devops/work-items?query=test` returned HTTP 200 with a valid JSON response and zero matches for that literal query.
- DIAGNOSIS: the previous production auth blockers are resolved: org matching now succeeds, and the dedicated token encryption key lets fresh web sessions store Azure DevOps tokens for work-item search.
- REMAINING: exact deployed commit proof still requires production build metadata; `/api/health` still reports unknown SHA/build time.

## 2026-07-01 11:58:50 CEST - Loop 52 Start

- PASS: repository is clean on `main` and aligned with `origin/main`.
- PASS: last pushed QA evidence commit `0f9b2b8 Record production auth fix verification` has passing GitHub Actions CI and Build extension workflows.
- FOCUS: real VS Code usage QA now that production Azure auth and signed-in work-item API are working.
- PLAN: inspect extension real-use commands/config, build or package the extension, launch a VS Code host, configure it for production, trigger a realistic sync/status/dashboard workflow, then record production evidence.

## 2026-07-01 12:19:09 CEST - Loop 52 Admin Runtime Config

- UPDATED: production `ADMIN_AZURE_DEVOPS_LOGINS` in Dokploy to include the requested login while preserving existing runtime env, build args, and build secrets. The admin list is intentionally not recorded here.
- PASS: Dokploy environment save returned OK and the runtime env has one canonical admin-login line.
- PASS: Dokploy deploy trigger returned OK and application status reported `done`.
- PASS: fresh production Chrome logout/login landed on `/dashboard` with the Admin nav visible.
- PASS: direct production `/admin` load rendered admin content and export links without unauthorized state.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha 0f9b2b8` passed all hard gates after redeploy; warnings remain limited to unknown build metadata/SHA.
- Next: resume real VS Code extension usage QA against production.

## 2026-07-01 12:39:46 CEST - Loop 53 Extension Auth Rewrite

- FAIL/REAL: real VS Code `Copilot Tracker: Sign In` opened Microsoft auth and failed with `AADSTS65002` because the VS Code Microsoft first-party client is not preauthorized for Azure DevOps delegated scopes.
- DIAGNOSIS: the extension should not request raw Azure DevOps tokens through VS Code. The web app already owns the correct PKCE Azure session and stores Azure tokens server-side.
- IMPLEMENTED: added `/api/auth/extension-token`, which requires an existing tracker web session, copies server-side Azure token material into a new tracker session, and redirects to the extension's `vscode://.../auth` callback with a tracker session token.
- IMPLEMENTED: extension now registers a URI handler, opens the tracker web sign-in route, validates callback state, stores the tracker token in VS Code SecretStorage, and sends it as the API bearer token.
- IMPLEMENTED: API ingest accepts tracker session bearer tokens before falling back to legacy raw Azure bearer validation. Work-item search uses stored Azure tokens when the bearer is a tracker session.
- REMOVED: stale extension Azure DevOps auth provider source. Cleaned the generated output before packaging so the VSIX no longer includes the deleted module.
- FIXED: root VS Code launch/task config now targets `apps/extension` and runs the extension package `pnpm watch`.
- PASS: `pnpm --filter @copilot-tracker/web test` (137 tests)
- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder env
- PASS: `pnpm --filter ./apps/extension test` (29 tests)
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: clean VSIX package excludes `azureDevOpsAuth.js`; rebuilt VSIX installed into real VS Code.
- Next: commit/push, verify CI/deploy, then rerun real VS Code sign-in and sync against production.

## 2026-07-01 12:54:11 CEST - Loop 54 Start: Real VS Code Production Usage

- PASS: repository is clean on `main` at `311bd56`.
- PASS: production extension-token route is deployed and rejects invalid callbacks; production smoke passes hard gates with known build-metadata warnings.
- CONTEXT: requested production admin access was configured and verified without recording the admin list or runtime env values.
- FOCUS: reload real VS Code, sign in through the tracker web callback, sync realistic OTel telemetry, check status bar/tooltip/click-through, and verify production dashboard ingestion.

## 2026-07-01 13:17:10 CEST - Loop 54 Real VS Code Verification

- PASS: real VS Code `Copilot Tracker: Sign In` completed through the production web callback. VS Code showed and accepted the expected external-site and extension URI prompts, then displayed signed-in success.
- PASS: realistic OTel fixture synced to production with one request, 321 input tokens, 123 output tokens, 444 total tokens, `gpt-5-nano`, and estimated cost `$0.0001`.
- PASS: VS Code status bar showed task `124`, session token total `444 tokens`, and hover metadata with input/output/total/cost split.
- PASS: `Copilot Tracker: Set Current Task` searched production work items through the tracker session bearer; the route returned HTTP 200 and the manual fallback assignment `124` updated VS Code state immediately.
- PASS: production dashboard opened from VS Code, and after reload showed the assigned task `124`, one request, the model, and the exact token split/total/cost.
- FOUND: real VS Code logs exposed an OTel lifecycle feedback loop that repeatedly rewrote Copilot's `outfile` setting, rebuilt lifecycle timers, and sent redundant session events.
- FIXED LOCALLY: added a single-flight lifecycle rebuild queue, tracked the active OTel file path so poll/sync do not reconfigure Copilot settings, and ignored configuration-change events caused by the extension's own exporter setup.
- PASS: rebuilt/installed VSIX, reloaded real VS Code, and observed a quiet post-reload log over a longer sample: one startup sync, one initial file signature capture, no repeated exporter/lifecycle loop.
- PASS: checks run after the fix: `pnpm -r typecheck`, `pnpm -r lint`, placeholder-env web build, extension compile/test, workspace tests, and smoke tests.
- NEXT: commit/push the OTel lifecycle fix and QA log updates, then poll CI/deploy and rerun production smoke.

## 2026-07-01 13:23:00 CEST - Loop 54 Commit/CI/Smoke Closeout

- PUSHED: `ae3d4e4 Stabilize extension OTel lifecycle` to `main`.
- PASS: remote `origin/main` points at `ae3d4e465e46e85211e6a8465999ca66d76fc23e`.
- PASS: GitHub Actions `CI` completed successfully for `ae3d4e4`.
- PASS: GitHub Actions `Build extension` completed successfully for `ae3d4e4`.
- PASS/WARN: `pnpm smoke:production -- --allow-known-stale --expect-sha ae3d4e4` passed all hard gates against https://copilot-tracker.antek.page.
- WARN: production still reports `/api/health` `version.sha="unknown"` and `builtAt="unknown"`, so exact deployed commit proof remains blocked until build metadata is configured.
- PASS: working tree was clean after push before this log-only closeout update.
- NEXT: configure build metadata for strict exact-SHA production smoke; otherwise the real VS Code/admin/auth path is verified for this loop.
