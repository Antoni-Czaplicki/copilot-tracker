# Nightly QA Status

- Current time: 2026-07-01 09:01:38 CEST
- Current loop: 44
- State: validated
- Focus: Add exact deployed-SHA verification to production smoke and record VPS/Dokploy recovery evidence
- Blocker: exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`; signed-in Azure E2E should be rechecked in Chrome after the VPS/auth recovery
- Latest completed pushed evidence: `0bc8f68 Record health header QA poll`; GitHub Actions CI and Build extension completed successfully
- Next action: commit/push expected-SHA smoke verifier, poll CI, then use production smoke and Chrome for the next E2E pass
- Production target: https://copilot-tracker.antek.page
