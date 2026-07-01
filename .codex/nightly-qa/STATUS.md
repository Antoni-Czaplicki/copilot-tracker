# Nightly QA Status

- Current time: 2026-07-01 14:42:00 CEST
- Current loop: 58
- State: WorkItemPicker keyboard/listbox index regression coverage is deployed and verified in production
- Focus: continue remaining QA gaps after recording picker coverage deploy
- Blocker: Docker daemon is unavailable locally, so full local Docker image builds cannot be run on this machine. Dokploy built and deployed the Docker image successfully.
- Latest completed pushed evidence: `d19e76c Cover work-item picker keyboard movement`; GitHub Actions CI and Build extension passed, Dokploy built the image, Dokploy Reload was again needed after "done", and strict production smoke passed.
- Diagnosis: production web auth/session token persistence is working. Real VS Code sign-in now uses tracker web sign-in plus a VS Code URI callback, stores a tracker session token in SecretStorage, and uses that token for API calls while Azure DevOps tokens remain server-side.
- Latest live verification: real VS Code signed in through production, synced a one-request OTel fixture, displayed task `124`, 321 input tokens, 123 output tokens, 444 total tokens, and `$0.0001` estimated cost. Production dashboard reload showed the assigned task/session/token split. Rebuilt VSIX with OTel lifecycle stability fix stopped the repeated exporter/lifecycle log storm over a longer post-reload sample.
- Latest local/deployed change: Docker builds generate `apps/web/src/generated/buildInfo.generated.ts` before `next build` from explicit metadata, common source metadata, or minimal `.git` refs; health reads that generated module after explicit env/common env fallbacks.
- Latest deployed change: Azure DevOps text work-item search now tries the substring WIQL fallback when the words query returns zero results, and numeric empty states now say there is no Azure DevOps match for that ID instead of a vague "No matches".
- Latest deployed change: WorkItemPicker ArrowUp/ArrowDown active-result movement is now a tested pure helper, covering bounds and stale-index clamping without adding a heavyweight DOM test stack.
- Latest checks: `pnpm --filter @copilot-tracker/web test` (144 tests), web typecheck, web lint, production-style web build, `pnpm test:smoke`, repo typecheck/lint, root `pnpm test`, `git diff --check`, GitHub Actions CI, GitHub Actions Build extension, Dokploy deployment, Dokploy Reload, and strict `pnpm smoke:production -- --expect-sha d19e76c` all passed.
- Next action: commit/push the QA log closeout or carry it into the next code/doc increment, then continue the next highest-value QA gap.
- Production target: https://copilot-tracker.antek.page
