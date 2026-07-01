# Nightly QA Status

- Current time: 2026-07-01 09:19:57 CEST
- Current loop: 45
- State: validated
- Focus: Add redacted Azure auth diagnostics and automate production `auth_ref` freshness checks
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=invalid_client`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `0d1bab4 Add redacted auth diagnostics`; GitHub Actions CI and Build extension completed successfully
- Next action: commit/push production smoke `auth_ref` assertion, poll CI, deploy, then verify production failure URL includes `auth_ref` and Dokploy logs include matching redacted `azure_oauth_callback_failed` events
- Production target: https://copilot-tracker.antek.page
