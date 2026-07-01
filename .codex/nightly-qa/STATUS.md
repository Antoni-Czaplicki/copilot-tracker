# Nightly QA Status

- Current time: 2026-07-01 13:17:10 CEST
- Current loop: 54
- State: real VS Code production usage path is working; extension tracker-session sign-in, OTel sync, task assignment, and production dashboard verification passed
- Focus: commit/push the OTel lifecycle stability fix and QA logs, then verify CI/deploy/smoke
- Blocker: none active. Exact deployed commit still cannot be proven from production because `/api/health` reports `sha="unknown"` and `builtAt="unknown"`.
- Latest completed pushed evidence: `311bd56 Use tracker session auth for extension`; GitHub Actions CI and Build extension passed, and production `/api/auth/extension-token` is deployed.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest checks: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm --filter @copilot-tracker/web build` with safe placeholder production env, `pnpm --filter ./apps/extension compile`, `pnpm --filter ./apps/extension test`, `pnpm -r test --if-present`, and `pnpm test:smoke` all passed.
- Next action: commit/push `apps/extension` OTel lifecycle fix plus QA logs, poll GitHub Actions/Dokploy, rerun production smoke, and verify deployed behavior remains stable.
- Production target: https://copilot-tracker.antek.page
