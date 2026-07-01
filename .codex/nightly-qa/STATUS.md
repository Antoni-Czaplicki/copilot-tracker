# Nightly QA Status

- Current time: 2026-07-01 12:39:46 CEST
- Current loop: 53
- State: real VS Code exposed extension auth failure; tracker-session browser callback fix implemented and locally validated
- Focus: commit/push/deploy extension-token auth flow, then rerun real VS Code sign-in, OTel sync, status-bar, and production dashboard verification
- Blocker: production has not deployed the new `/api/auth/extension-token` route yet. Exact deployed commit still cannot be proven from production because `/api/health` reports `sha="unknown"` and `builtAt="unknown"`.
- Latest completed pushed evidence: `0f9b2b8 Record production auth fix verification`; GitHub Actions CI and Build extension passed, production auth and signed-in work-item API were verified.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in failed with Microsoft `AADSTS65002` because the extension requested Azure DevOps scopes through VS Code's first-party Microsoft auth provider. The extension now opens the tracker web app, receives a tracker session token through a VS Code URI callback, stores it in SecretStorage, and uses that token for API calls while Azure tokens remain server-side.
- Latest live verification: rebuilt VSIX installed into real VS Code; pre-fix real VS Code status bar correctly showed unauthenticated sync state; post-fix local checks pass.
- Next action: commit/push the extension-token auth fix, wait for deployment, verify `/api/auth/extension-token` in production, then run real VS Code sign-in and OTel sync against production.
- Production target: https://copilot-tracker.antek.page
