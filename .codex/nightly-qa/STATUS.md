# Nightly QA Status

- Current time: 2026-07-01 09:26:34 CEST
- Current loop: 45
- State: deployed diagnostics verified and operator diagnosis recorded
- Focus: Add redacted Azure auth diagnostics and automate production `auth_ref` freshness checks
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=invalid_client`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `615f097 Check auth references in production smoke`; GitHub Actions CI and Build extension completed successfully; production direct provider-error smoke includes `auth_ref`; real Chrome auth failure `auth_ref` matches a redacted Dokploy log event
- Next action: fix Azure app registration mismatch reported by Dokploy logs (`AADSTS700025`: public client receiving client secret), then rerun Chrome login; separately configure build metadata for strict exact-SHA smoke. No Dokploy MCP is currently exposed, so use Dokploy UI via Chrome or Termius/SSH for operator-side log/config checks.
- Production target: https://copilot-tracker.antek.page
