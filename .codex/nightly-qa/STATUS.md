# Nightly QA Status

- Current time: 2026-07-01 10:23:13 CEST
- Current loop: 48
- State: Azure Web redirect verified; next auth blocker is profile/org validation
- Focus: Add redacted profile/org diagnostics for the new production OAuth failure stage
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=profile_or_org_check_failed`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `e614348 Record Azure portal auth diagnosis`; GitHub Actions CI and Build extension completed successfully; production smoke passed hard gates with only build-metadata warnings
- Next action: deploy profile/org diagnostic logging, retry Chrome login, and use the matching `auth_ref` in Dokploy logs to distinguish profile lookup failure from organization membership mismatch
- Production target: https://copilot-tracker.antek.page
