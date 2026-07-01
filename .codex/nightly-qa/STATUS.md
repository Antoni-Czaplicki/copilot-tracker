# Nightly QA Status

- Current time: 2026-07-01 13:35:08 CEST
- Current loop: 55
- State: local Docker build metadata fallback is implemented and validated; commit/push/CI/deploy verification is next
- Focus: make `/api/health` self-identify Dockerfile builds without requiring a manual Dokploy SHA env update every deploy
- Blocker: Docker daemon is unavailable locally, so the full Docker image build cannot be run on this machine. Production exact deployed commit still cannot be proven until the new fallback deploys and strict smoke passes.
- Latest completed pushed evidence: `5b5b4c4 Record OTel lifecycle verification`; GitHub Actions CI and Build extension passed, remote `main` points at the commit, and live production smoke passes hard gates with known build-metadata warnings.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest local change: Docker builds now generate `apps/web/build-info.json` from explicit metadata, common source metadata, or minimal `.git` `HEAD`/ref files; health reads that file only after explicit env/common env fallbacks.
- Latest checks: `pnpm test:smoke`, `pnpm --filter @copilot-tracker/web test`, `pnpm --filter @copilot-tracker/web typecheck`, `pnpm --filter @copilot-tracker/web lint`, `pnpm -r typecheck`, `pnpm -r lint`, production-style `pnpm --filter @copilot-tracker/web build`, `pnpm --filter ./apps/extension compile`, `pnpm --filter ./apps/extension test`, root `pnpm test`, `docker compose config`, and `git diff --check` all passed. `docker version` failed because the local Docker daemon socket is unavailable.
- Next action: commit/push the Docker build-info fallback, poll GitHub Actions/Dokploy, rerun production smoke, and try strict exact-SHA smoke once production deploys the new image.
- Production target: https://copilot-tracker.antek.page
