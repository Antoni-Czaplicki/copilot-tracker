# Nightly QA Status

- Current time: 2026-07-01 13:23:00 CEST
- Current loop: 54
- State: real VS Code production usage path is working; extension tracker-session sign-in, OTel sync, task assignment, dashboard verification, OTel lifecycle fix, commit/push, CI, and production smoke all passed
- Focus: only the production build metadata gap remains for strict exact-SHA deployment proof
- Blocker: none active. Exact deployed commit still cannot be proven from production because `/api/health` reports `sha="unknown"` and `builtAt="unknown"`.
- Latest completed pushed evidence: `ae3d4e4 Stabilize extension OTel lifecycle`; GitHub Actions CI and Build extension passed, remote `main` points at the commit, and live production smoke passes hard gates.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest checks: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm --filter @copilot-tracker/web build` with safe placeholder production env, `pnpm --filter ./apps/extension compile`, `pnpm --filter ./apps/extension test`, `pnpm -r test --if-present`, `pnpm test:smoke`, GitHub Actions CI, GitHub Actions Build extension, and live `pnpm smoke:production -- --allow-known-stale --expect-sha ae3d4e4` all passed.
- Next action: configure production build metadata when convenient so `/api/health` exposes the deployed SHA/build time and strict `pnpm smoke:production -- --expect-sha <sha>` can pass without known-stale mode.
- Production target: https://copilot-tracker.antek.page
