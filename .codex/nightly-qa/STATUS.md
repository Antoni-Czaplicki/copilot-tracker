# Nightly QA Status

- Current time: 2026-07-01 11:36:00 CEST
- Current loop: 51
- State: production Azure sign-in and signed-in work-item API verified
- Focus: Record the production auth fix and remaining deployment proof gap
- Blocker: no active Azure auth/work-item blocker. Exact deployed commit still cannot be proven from production because `/api/health` reports `sha="unknown"` and `builtAt="unknown"`.
- Latest completed pushed evidence: `1506101 Record configured org access diagnosis`; GitHub Actions CI and Build extension passed, Dokploy shows deployment done, and production smoke passed hard gates with only build metadata warnings.
- Diagnosis: the previous `profile_or_org_check_failed` was resolved by correcting the production Azure DevOps org runtime configuration. The follow-up signed-in work-item `401` was resolved by adding the dedicated runtime session-token encryption key and creating a fresh session after redeploy.
- Latest live verification: real Chrome logout/login now lands on `/dashboard`; signed-in `/api/azure-devops/work-items?query=test` returns HTTP 200 with a valid JSON shape and zero matches for that literal query.
- Next action: configure Dokploy build metadata (`COPILOT_TRACKER_BUILD_SHA` and `COPILOT_TRACKER_BUILD_TIME`) if exact deployed commit proof is required, then rerun strict production smoke.
- Production target: https://copilot-tracker.antek.page
