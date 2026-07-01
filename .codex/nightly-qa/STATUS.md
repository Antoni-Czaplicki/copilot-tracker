# Nightly QA Status

- Current time: 2026-07-01 14:26:36 CEST
- Current loop: 57
- State: deployment docs updated with Dokploy stale-rollout fallback and validated locally
- Focus: commit/push the deployment docs/log update, then continue the next QA gap
- Blocker: Docker daemon is unavailable locally, so full local Docker image builds cannot be run on this machine. Dokploy built and deployed the Docker image successfully.
- Latest completed pushed evidence: `ee12b62 Record work-item search deployment verification`; GitHub Actions CI and Build extension passed. Production app commit remains `6477f9c`, which is expected because the notes commit only touched `.codex` files outside the app build/watch paths.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest local/deployed change: Docker builds generate `apps/web/src/generated/buildInfo.generated.ts` before `next build` from explicit metadata, common source metadata, or minimal `.git` refs; health reads that generated module after explicit env/common env fallbacks.
- Latest deployed change: Azure DevOps text work-item search now tries the substring WIQL fallback when the words query returns zero results, and numeric empty states now say there is no Azure DevOps match for that ID instead of a vague "No matches".
- Latest checks: `pnpm --filter @copilot-tracker/web test`, `pnpm --filter @copilot-tracker/web typecheck`, `pnpm --filter @copilot-tracker/web lint`, production-style `pnpm --filter @copilot-tracker/web build`, `pnpm test:smoke`, `pnpm -r typecheck`, `pnpm -r lint`, `pnpm --filter ./apps/extension test`, root `pnpm test`, `git diff --check`, GitHub Actions CI, GitHub Actions Build extension, Dokploy deployment, Dokploy Reload, strict `pnpm smoke:production -- --expect-sha 6477f9c`, and live Chrome dashboard picker verification all passed.
- Next action: commit/push the deployment docs/log update, poll CI, and continue the next highest-value QA gap.
- Production target: https://copilot-tracker.antek.page
