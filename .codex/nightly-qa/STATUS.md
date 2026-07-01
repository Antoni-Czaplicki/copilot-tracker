# Nightly QA Status

- Current time: 2026-07-01 10:53:27 CEST
- Current loop: 50
- State: direct configured-org access probe implemented locally and focused validation passed
- Focus: Allow Azure login when the account-list API does not expose the same organization slug but the signed-in token can query the configured Azure DevOps org directly
- Blocker: signed-in Azure E2E is still blocked on the currently deployed `9a3acb1` build by real Chrome login returning `auth_code=profile_or_org_check_failed`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `9a3acb1 Normalize Azure DevOps org URLs`; GitHub Actions CI and Build extension passed, Dokploy shows deployment done, but real Chrome login still failed and the matching log shows profile OK, account count 1, org membership not matched
- Local change ready to commit: after account-name membership mismatch, the server now probes the configured Azure DevOps org WIQL endpoint with the same token and accepts only a valid successful WIQL JSON response; redacted `orgAccessProbeResult`/`orgAccessProbeStatus` diagnostics are logged
- Next action: commit/push the direct org-access probe, poll CI/deploy, then retry Chrome login and dashboard/work-item E2E
- Production target: https://copilot-tracker.antek.page
