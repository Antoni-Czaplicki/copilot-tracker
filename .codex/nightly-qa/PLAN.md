# Nightly QA Plan

## Loop 1 - Baseline, Inventory, Subagents

- [x] Create `.codex/nightly-qa/`
- [x] Initialize persistent status, plan, and loop log
- [x] Spawn focused subagents
- [x] Inspect repository structure, scripts, and recent changes
- [x] Build initial test matrix with at least 100 meaningful cases
- [x] Run baseline local checks
- [x] Identify the first high-value focused improvement
- [x] Implement, test, document, commit, push, and verify deployment status

## Loop 2 - Production Freshness and Remaining Gaps

- [ ] Wait for latest GitHub CI to finish
- [ ] Poll production `/api/health` and OAuth/privacy behavior
- [ ] Investigate Dokploy/deploy visibility or document blocker
- [ ] Continue remaining high-value fixes
- [ ] Run full repo checks after next code slice
- [ ] Update handoff and deployment logs

## Rolling Focus Areas

- [ ] VS Code extension activation, auth, telemetry capture, token/cost display, task UX
- [ ] Web app auth, dashboard, grouping, task assignment, admin, leaderboard, mobile states
- [ ] API/backend auth, Azure DevOps routes, request ingest, update flows, validation, privacy
- [ ] Deployment/Dokploy production behavior and stale-build detection
- [ ] Documentation, env examples, handoff, operational clarity

## Loop 4 - Chat Request Merge Coverage

- [x] Extract batch ingest merge/token normalization into a pure helper
- [x] Add token-source normalization coverage
- [x] Add duplicate request-record merge coverage
- [x] Run broad local validation
- [x] Commit, push, and verify production smoke
- [x] Verify CI completion for `4e96bf2`

## Loop 5 - Request Sessions Grid Model Coverage

- [x] Extract pure session-grid helpers
- [x] Add grouping/focused-session ordering tests
- [x] Add task fallback/override/clearing tests
- [x] Add token label/session anchor tests
- [x] Run local validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `12eb414`

## Loop 6 - Extension Status Formatting Coverage

- [x] Extract extension status formatting helpers
- [x] Add task truncation tests
- [x] Add session token number/cost formatting tests
- [x] Run local validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `80f9933`

## Loop 7 - GitHub Username Mapping Feedback

- [x] Add tested GitHub-login mutation error-message helper
- [x] Show safe server validation errors in the editor
- [x] Run local validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `21a41f5`

## Loop 8 - Extension Dashboard URL Coverage

- [x] Extract open-dashboard URL helper
- [x] Add tests for base dashboard URL and encoded session links
- [x] Run local validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `88b55a0`

## Loop 9 - Extension Task History Resolution

- [x] Extract task-history parsing/resolution helpers
- [x] Add history validation and sorting tests
- [x] Add request-time task attribution tests
- [x] Run local validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `439b174`

## Loop 10 - Chrome Production Smoke

- [x] Verify homepage in real Chrome
- [x] Verify auth redirect failure path in real Chrome
- [x] Confirm provider details are not exposed
- [x] Confirm safe `invalid_client` hint renders in production

## Loop 11 - Task History Resolver Robustness

- [x] Defensively sort history inside resolver helper
- [x] Update tests to pass unsorted history
- [x] Run local validation
- [x] Commit, push, and smoke production
- [ ] Verify CI completion for `db1bd63`

## Loop 12 - Extension Packaging Validation

- [x] Run extension VSIX package command
- [x] Remove generated VSIX artifact from the worktree
- [x] Record result and continue

## Loop 13 - Extension Package License

- [x] Add package-local extension LICENSE
- [x] Rerun extension package command
- [x] Verify warning is gone and validate
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `ef40fc3`

## Loop 14 - Azure Session Token Helpers

- [x] Extract Azure DevOps session-token parsing/expiry helpers
- [x] Add tests for access-token validation, refresh-token fallback, default expiry, and near-expiry behavior
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `c944583`

## Loop 15 - Session Token Crypto Helpers

- [x] Extract session-token encryption/decryption helpers from `store.ts`
- [x] Reject malformed encrypted-token envelopes directly
- [x] Add round-trip, missing-key, legacy-token, malformed-token, and tamper tests
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `5b06f76`

## Loop 16 - GitHub Login Payload Validation

- [x] Extract a shared JSON-object payload reader
- [x] Reject non-object JSON bodies instead of treating them as empty objects
- [x] Use the helper in user/admin GitHub-login PATCH routes
- [x] Add tests for valid object, malformed JSON, arrays, strings, and null
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `2906354`

## Loop 17 - Work Item API Status Mapping

- [x] Extract Azure DevOps work-item client status mapping
- [x] Add tests for 401/403/429 passthrough and generic 502 fallback
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `5447dd0`

## Loop 18 - Cron Authorization Coverage

- [x] Extract GitHub billing sync cron bearer authorization helper
- [x] Use shared bearer parsing for cron authorization
- [x] Add tests for missing secret, missing header, exact token, whitespace/casing, and wrong token
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `5a921fe`

## Loop 19 - Auth Failure Hint Coverage

- [x] Add coverage for remaining stable auth failure hints
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `93df1e2`

## Loop 20 - Health Response Cache Control

- [x] Add tested health response init helper
- [x] Send `Cache-Control: no-store` from `/api/health`
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `2456c3e`
- [ ] Verify production health includes `Cache-Control: no-store`

## Loop 21 - Docs and Env Drift

- [x] Re-sync git, CI, and production health
- [x] Inspect `.env.example`, README, extension README, and deployment docs for drift
- [x] Implement the highest-value documentation or code hardening slice found
- [x] Run focused and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `69a50f6`
- [ ] Verify production health includes `Cache-Control: no-store`

## Loop 22 - Shared Frontend Error Messages

- [x] Re-sync prior commit CI status
- [x] Identify duplicated frontend response error parsing
- [x] Add shared response-error helper and tests
- [x] Wire task editing, session bulk assignment, GitHub billing sync, GitHub login mapping, and work-item search helpers
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `fc5ccd1`

## Loop 23 - Extension TrackerClient Response Hardening

- [x] Re-sync prior commit CI status
- [x] Inspect extension task search/client response handling
- [x] Filter malformed work-item search payload entries
- [x] Fall back for blank server error strings
- [x] Add extension regression tests
- [x] Run focused extension tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `bab82eb`

## Loop 24 - GitHub Billing Response Normalization

- [x] Re-sync prior commit CI status
- [x] Extract pure GitHub billing row normalizer
- [x] Tolerate malformed `usageItems` and invalid `timePeriod` values
- [x] Add web regression tests
- [x] Fix env-coupled test import and TypeScript guard found during validation
- [x] Run focused web tests and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `36b506e`

## Loop 25 - Chrome Production Smoke

- [x] Load Chrome-control workflow
- [x] Verify production homepage title and login anchors in Chrome
- [x] Verify `/api/auth/azure-devops` real-browser flow returns `auth_code=invalid_client`
- [x] Verify failure copy includes safe generic guidance and does not expose provider details
- [x] Close Chrome test tab
- [x] Continue next code/test improvement

## Loop 26 - GitHub Billing Impossible Date Guard

- [x] Re-sync prior commit CI status
- [x] Reject impossible response time-period dates
- [x] Add regression coverage
- [x] Run focused and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `8256b76`

## Loop 27 - Shared Route JSON Parsing

- [x] Inspect ingest/update route JSON parsing
- [x] Add shared `readJsonPayload` helper
- [x] Reuse helper in events, chat request batch, bulk update, and single update routes
- [x] Add JSON helper regression coverage
- [x] Fix lint warning found during validation
- [x] Run focused and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `72438f5`

## Loop 28 - Auth Failure Alert UX

- [x] Inspect homepage/auth failure rendering
- [x] Make auth failure/misconfigured cards `role="alert"` with assertive live region
- [x] Add destructive visual emphasis and monospace error code display
- [x] Run broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `a12045b`

## Loop 29 - Dependency and Release Readiness

- [x] Re-sync git and CI state for `a12045b`
- [x] Inspect package metadata and GitHub workflows
- [x] Run extension VSIX packaging check
- [x] Run production dependency audit
- [x] Move enforceable security overrides to `pnpm-workspace.yaml`
- [x] Refresh lockfile and installed modules
- [x] Verify audit passes and PostCSS resolves to the patched version
- [x] Run broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `f76379a`

## Loop 30 - Successful Response UI Reliability

- [x] Re-sync git, CI, and production health/auth smoke state
- [x] Inspect health implementation for the missing production no-store header
- [x] Inspect remaining client mutation JSON parsing paths
- [x] Add shared numeric response-field helper and regression tests
- [x] Reuse helper in admin billing sync and request session mutation success handling
- [x] Run focused web validation and broad checks
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `2b69124`

## Loop 31 - Work Item Picker Payload Robustness

- [x] Re-sync git and CI state for `2b69124`
- [x] Inspect WorkItemPicker successful response parsing
- [x] Add successful payload normalizer and tests
- [x] Wire picker rendering through normalized work-item results
- [x] Fix typecheck/lint issues found during validation
- [x] Run focused and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `f2ab551`

## Loop 32 - Azure DevOps Upstream Response Hardening

- [x] Re-sync git and CI state for `f2ab551`
- [x] Inspect work-item route/client successful response parsing
- [x] Add typed bad-response handling for malformed successful upstream JSON
- [x] Guard WIQL id and batch work-item payload shapes
- [x] Add Azure DevOps work-item regression tests
- [x] Run focused and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `de00e83`

## Loop 33 - Billing Sync Method Authorization

- [x] Re-sync git and CI state for `de00e83`
- [x] Inspect admin billing sync route method behavior
- [x] Add pure billing sync authorization helper and tests
- [x] Make GET cron-only while POST keeps admin/manual fallback
- [x] Update README API and billing sync docs
- [x] Run focused and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `784ef08`

## Loop 34 - Extension Work Item Id Guard

- [x] Re-sync git and CI state for `784ef08`
- [x] Inspect extension work-item result validation
- [x] Align extension ID guard with backend/web positive Azure DevOps ID range
- [x] Expand extension malformed payload test
- [x] Run focused and broad validation
- [x] Commit, push, and smoke production
- [x] Verify CI completion for `294cf69`

## Loop 35 - Chrome Production Smoke

- [x] Re-sync git and CI state for `294cf69`
- [x] Load and use Chrome control workflow
- [x] Verify production homepage title and login links in Chrome
- [x] Verify auth route reaches known `auth_code=invalid_client` state
- [x] Verify visible failure copy stays safe
- [x] Record missing production alert semantics as deployment freshness risk
- [x] Choose next focused improvement or source-side freshness fix

## Loop 36 - Azure Provider Error Codes

- [x] Re-sync git and nightly status
- [x] Scan TODOs and API/auth boundary surfaces
- [x] Preserve sanitized OAuth provider error codes in callback redirects
- [x] Add provider-code sanitization, blank fallback, and `access_denied` hint coverage
- [x] Run focused web auth tests
- [x] Run broad validation
- [x] Commit, push, smoke production, and poll CI

## Loop 37 - Work Item Picker Id Bounds

- [x] Re-sync CI/deploy state for `4538973`
- [x] Inspect web task assignment picker and request-session task workflows
- [x] Align web WorkItemPicker payload ID filtering with backend/extension bounds
- [x] Expand malformed work-item payload regression coverage
- [x] Run focused web tests
- [x] Run broad validation
- [x] Commit, push, smoke production, and poll CI

## Loop 38 - Extension Server Error Message Cap

- [x] Re-sync CI/deploy state for `27e58c3`
- [x] Inspect extension server error parsing and existing tests
- [x] Cap JSON `{ error }` messages with the same 240-character limit as plain text errors
- [x] Add extension regression coverage
- [x] Run focused extension tests
- [x] Run broad validation
- [x] Commit, push, smoke production, and poll CI

## Loop 39 - Auth Callback Smoke Docs

- [x] Re-sync CI/deploy state for `625a202`
- [x] Inspect deployment/readme auth smoke documentation
- [x] Clarify sanitized provider `auth_code` preservation vs provider-description hiding
- [x] Run docs diff check
- [x] Commit, push, smoke production, and poll CI

## Loop 40 - Final Handoff Cleanup

- [x] Re-run production dependency audit
- [x] Re-check patched PostCSS dependency resolution
- [x] Verify latest pushed commit CI status
- [x] Run final production health/auth-start/provider-callback smoke
- [x] Update handoff, deployment, status, and loop logs

## Loop 41 - Production Smoke Verifier

- [x] Re-sync latest `cf5ade1` CI and production state
- [x] Inspect health/auth freshness source paths and deployment docs
- [x] Add strict production smoke script with known-stale warning mode
- [x] Document `pnpm smoke:production`
- [x] Validate script syntax, strict failure behavior, known-stale warning mode, typecheck, lint, and full tests
- [x] Commit, push, smoke production, and poll CI

## Loop 42 - Production Smoke Verifier Tests

- [x] Re-sync latest `1384cfe` CI and production state
- [x] Add local HTTP-server tests for fresh, strict stale, and known-stale smoke outcomes
- [x] Wire smoke verifier tests into the root `pnpm test` flow
- [x] Run focused smoke tests
- [x] Run typecheck, lint, root tests, production web build, extension compile, and live known-stale smoke
- [x] Commit, push, smoke production, and poll CI

## Loop 43 - Health Freshness Headers

- [x] Re-sync latest `71783ad` CI, production smoke, and nightly status
- [x] Inspect health response helper, route headers, and Next config behavior
- [x] Expand `/api/health` freshness headers for browser, CDN, proxy, and surrogate caches
- [x] Configure Next to emit the same freshness headers for `/api/health`
- [x] Add regression coverage for the expanded health header contract
- [x] Run typecheck, lint, root tests, production web build, extension compile, live known-stale smoke, and diff check
- [x] Commit, push, smoke production, and poll CI

## Loop 44 - Exact Deployment Smoke

- [x] Re-sync latest `0bc8f68` CI and production state after VPS recovery
- [x] Verify production now sends health cache headers and preserves provider `access_denied`
- [x] Verify production auth failure page includes `role="alert"` without provider-detail leakage
- [x] Add `--expect-sha` support to `pnpm smoke:production`
- [x] Add smoke verifier coverage for expected SHA match, prefix match, mismatch failure, known-stale warning, and forwarded `--` separator
- [x] Document exact deployed SHA smoke usage
- [x] Run broad validation
- [x] Commit, push, smoke production, and poll CI
