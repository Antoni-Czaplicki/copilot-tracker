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
