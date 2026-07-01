# Nightly QA Status

- Current time: 2026-07-01 09:36:54 CEST
- Current loop: 47
- State: Azure portal diagnosis complete; live config edit blocked in current signed-in context
- Focus: Convert `invalid_client` into an exact operator fix and unblock signed-in Azure E2E
- Blocker: signed-in Azure E2E is still blocked by real Chrome login returning `auth_code=invalid_client`; exact deployed commit still cannot be proven because production `/api/health` reports `sha="unknown"` and `builtAt="unknown"`
- Latest completed pushed evidence: `7137e29 Clarify Dokploy and Azure auth setup`; GitHub Actions CI and Build extension completed successfully; production smoke passed hard gates with only build-metadata warnings
- Next action: use an Entra account/role that can edit the app registration, move/add the production callback redirect URI under the `Web` platform for the current confidential backend flow, then rerun Chrome login and dashboard/work-item E2E. Current Chrome account can inspect the app registration but edit controls are disabled and it is not listed as an owner.
- Production target: https://copilot-tracker.antek.page
