# Nightly QA Status

- Current time: 2026-07-01 14:00:00 CEST
- Current loop: 56
- State: committing exact-SHA proof logs, then continuing real production/web QA
- Focus: preserve deployment proof in durable logs, verify the log commit through CI/Dokploy/smoke, then test visible dashboard work-item search with a known matching query
- Blocker: Docker daemon is unavailable locally, so full local Docker image builds cannot be run on this machine. Dokploy built and deployed the Docker image successfully.
- Latest completed pushed evidence: `23e4df9 Compile Docker build metadata`; GitHub Actions CI and Build extension passed, Dokploy deployment completed, and strict production smoke passed without known-stale mode. The follow-up log-only commit is pending.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest local/deployed change: Docker builds generate `apps/web/src/generated/buildInfo.generated.ts` before `next build` from explicit metadata, common source metadata, or minimal `.git` refs; health reads that generated module after explicit env/common env fallbacks.
- Latest checks: `pnpm test:smoke`, `pnpm --filter @copilot-tracker/web test`, `pnpm --filter @copilot-tracker/web typecheck`, `pnpm --filter @copilot-tracker/web lint`, `pnpm -r typecheck`, `pnpm -r lint`, production-style `pnpm --filter @copilot-tracker/web build`, `pnpm --filter ./apps/extension test`, root `pnpm test`, `git diff --check`, GitHub Actions CI, GitHub Actions Build extension, Dokploy deployment, and strict `pnpm smoke:production -- --expect-sha 23e4df9` all passed.
- Next action: commit/push the QA log updates, poll CI/Dokploy/production smoke for the new head, then test visible dashboard work-item search with a known matching query.
- Production target: https://copilot-tracker.antek.page
