# Nightly QA Status

- Current time: 2026-07-01 09:14:03 CEST
- Current loop: 45
- State: validated
- Focus: Add redacted Azure auth diagnostics for Dokploy logs with client-safe failure references
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=invalid_client`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `7d88d23 Record exact smoke QA poll`; GitHub Actions CI and Build extension completed successfully
- Next action: commit/push redacted auth diagnostics, poll CI, deploy, then verify production failure URL includes `auth_ref` and Dokploy logs include matching redacted `azure_oauth_callback_failed` events
- Production target: https://copilot-tracker.antek.page
