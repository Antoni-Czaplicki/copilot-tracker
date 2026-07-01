# Nightly QA Status

- Current time: 2026-07-01 11:04:24 CEST
- Current loop: 50
- State: deployed direct configured-org access probe verified
- Focus: Resolve production Azure DevOps organization access/configuration outside app code
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=profile_or_org_check_failed`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `01650a4 Probe configured Azure DevOps org access`; GitHub Actions CI and Build extension passed, Dokploy shows deployment done, production smoke passed hard gates, and a fresh Chrome login plus Dokploy log shows the configured-org WIQL probe fails with HTTP 401
- Diagnosis: Azure sign-in/profile lookup succeeds and Azure DevOps accounts returns one account, but the token cannot query the configured Azure DevOps org (`orgAccessProbeResult=request_failed`, `orgAccessProbeStatus=401`). This points to `AZURE_DEVOPS_ORG` not matching the signed-in user's accessible org, missing user membership/visibility, or missing/blocked Azure DevOps work-item consent for that org.
- Next action: fix production `AZURE_DEVOPS_ORG` or the signed-in user's Azure DevOps org access/consent, then rerun Chrome login and dashboard/work-item E2E
- Production target: https://copilot-tracker.antek.page
