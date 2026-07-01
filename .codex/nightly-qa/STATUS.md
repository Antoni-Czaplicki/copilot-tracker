# Nightly QA Status

- Current time: 2026-07-01 14:06:32 CEST
- Current loop: 56
- State: work-item search fallback and clearer empty-state status are implemented and validated locally
- Focus: commit/push the search UX/API improvement, then verify CI, Dokploy, production smoke, and live dashboard behavior after deploy
- Blocker: Docker daemon is unavailable locally, so full local Docker image builds cannot be run on this machine. Dokploy built and deployed the Docker image successfully.
- Latest completed pushed evidence: `f90a5b0 Record exact deploy proof verification`; GitHub Actions CI and Build extension passed. Production remained healthy but still served `23e4df9` when strict smoke was checked before the next code deploy.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest local/deployed change: Docker builds generate `apps/web/src/generated/buildInfo.generated.ts` before `next build` from explicit metadata, common source metadata, or minimal `.git` refs; health reads that generated module after explicit env/common env fallbacks.
- Latest local change: Azure DevOps text work-item search now tries the substring WIQL fallback when the words query returns zero results, and numeric empty states now say there is no Azure DevOps match for that ID instead of a vague "No matches".
- Latest checks: `pnpm --filter @copilot-tracker/web test`, `pnpm --filter @copilot-tracker/web typecheck`, `pnpm --filter @copilot-tracker/web lint`, production-style `pnpm --filter @copilot-tracker/web build`, `pnpm test:smoke`, `pnpm -r typecheck`, `pnpm -r lint`, `pnpm --filter ./apps/extension test`, root `pnpm test`, and `git diff --check` all passed for the work-item search change.
- Next action: commit/push the work-item search UX/API improvement, poll CI/Dokploy, then rerun production smoke and dashboard search UI verification.
- Production target: https://copilot-tracker.antek.page
