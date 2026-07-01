# Nightly QA Status

- Current time: 2026-07-01 09:29:26 CEST
- Current loop: 46
- State: documenting operator fixes for Azure app registration and Dokploy build metadata
- Focus: Make the remaining production fixes concrete: confidential Azure app/client config and explicit Dokploy build metadata
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=invalid_client`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `801c672 Record auth diagnostics deploy verification`; GitHub Actions CI and Build extension completed successfully
- Next action: finish and validate deployment docs that spell out the Azure confidential-client requirement and Dokploy build-arg/runtime-env metadata fields; then push and continue with live config verification when available
- Production target: https://copilot-tracker.antek.page
