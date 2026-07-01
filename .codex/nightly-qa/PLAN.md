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
- [ ] Commit, push, and smoke production
