# Nightly QA Status

- Current time: 2026-07-01 09:04:54 CEST
- Current loop: 44
- State: pushed and CI green
- Focus: Add exact deployed-SHA verification to production smoke and record VPS/Dokploy recovery evidence
- Blocker: exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`; signed-in Azure E2E should be rechecked in Chrome after the VPS/auth recovery
- Latest completed pushed evidence: `d948d06 Verify deployed commit in production smoke`; GitHub Actions CI and Build extension completed successfully
- Next action: use Chrome with the existing signed-in profile for production Azure/auth/dashboard E2E, then configure/prove build metadata with exact-SHA smoke
- Production target: https://copilot-tracker.antek.page
