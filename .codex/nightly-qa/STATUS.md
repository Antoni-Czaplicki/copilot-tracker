# Nightly QA Status

- Current time: 2026-07-01 10:32:28 CEST
- Current loop: 48
- State: deployed profile/org diagnostics verified
- Focus: Resolve remaining Azure organization membership mismatch after successful token exchange and profile lookup
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=profile_or_org_check_failed`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `7020999 Add profile org auth diagnostics`; GitHub Actions CI and Build extension completed successfully; production smoke passed hard gates with only build-metadata warnings; Dokploy logs for a fresh Chrome login include profile/org diagnostics
- Next action: fix `AZURE_DEVOPS_ORG` or Azure DevOps organization membership/visibility so the signed-in profile matches the configured organization; current deployed log evidence says `profileResult=ok`, `profileStatus=200`, `orgMembershipResult=not_matched`, `orgMembershipStatus=200`, and `orgMembershipAccountCount=1`
- Production target: https://copilot-tracker.antek.page
