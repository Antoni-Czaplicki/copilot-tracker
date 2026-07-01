# Nightly QA Status

- Current time: 2026-07-01 10:38:36 CEST
- Current loop: 49
- State: Azure DevOps organization URL normalization implemented locally and validation passed
- Focus: Remove likely `AZURE_DEVOPS_ORG` format mismatch after profile lookup succeeds and org membership does not match
- Blocker: signed-in Azure E2E is still blocked on the currently deployed build by real Chrome login returning `auth_code=profile_or_org_check_failed`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `20094a0 Record deployed profile org diagnosis`; GitHub Actions/deploy verification for the previous code commit was green; a fresh Chrome login plus Dokploy log still shows profile OK and org membership not matched
- Local change ready to commit: `AZURE_DEVOPS_ORG` normalization now accepts the older `https://<org>.visualstudio.com` URL form in addition to org slugs and `https://dev.azure.com/<org>` URLs, with focused tests and docs
- Next action: commit/push the org URL normalization change, poll CI/deploy, then retry Chrome login and dashboard/work-item E2E
- Production target: https://copilot-tracker.antek.page
