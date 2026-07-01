# Nightly QA Status

- Current time: 2026-07-01 14:22:33 CEST
- Current loop: 56
- State: work-item search fallback and clearer empty-state status are deployed and verified in production
- Focus: continue with the next remaining product/QA gap after recording Dokploy reload behavior
- Blocker: Docker daemon is unavailable locally, so full local Docker image builds cannot be run on this machine. Dokploy built and deployed the Docker image successfully.
- Latest completed pushed evidence: `6477f9c Improve Azure DevOps work-item search`; GitHub Actions CI and Build extension passed, Dokploy built the image with the correct compiled SHA, a manual Dokploy Reload was needed before production served it, and strict production smoke passed.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest local/deployed change: Docker builds generate `apps/web/src/generated/buildInfo.generated.ts` before `next build` from explicit metadata, common source metadata, or minimal `.git` refs; health reads that generated module after explicit env/common env fallbacks.
- Latest deployed change: Azure DevOps text work-item search now tries the substring WIQL fallback when the words query returns zero results, and numeric empty states now say there is no Azure DevOps match for that ID instead of a vague "No matches".
- Latest checks: `pnpm --filter @copilot-tracker/web test`, `pnpm --filter @copilot-tracker/web typecheck`, `pnpm --filter @copilot-tracker/web lint`, production-style `pnpm --filter @copilot-tracker/web build`, `pnpm test:smoke`, `pnpm -r typecheck`, `pnpm -r lint`, `pnpm --filter ./apps/extension test`, root `pnpm test`, `git diff --check`, GitHub Actions CI, GitHub Actions Build extension, Dokploy deployment, Dokploy Reload, strict `pnpm smoke:production -- --expect-sha 6477f9c`, and live Chrome dashboard picker verification all passed.
- Next action: investigate/record whether Dokploy can be configured to restart the service automatically after successful Dockerfile builds, or move to the next highest-value QA gap if this is a one-off VPS/Dokploy rollout quirk.
- Production target: https://copilot-tracker.antek.page
