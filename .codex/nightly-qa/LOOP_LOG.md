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
