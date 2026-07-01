# Next Agent Handoff

Generated: 2026-07-01 17:38 CEST

This file is the freshest handoff. If older nightly QA files disagree, re-check the worktree and CI first, then prefer this state.

## Current State

- Workspace: `/Users/antoniczaplicki/WebstormProjects/copilot-tracker`.
- Branch before pending commit: `main` at `9b8a52f Cover extension OTel task history attribution`.
- Production URL: `https://copilot-tracker.antek.page`.
- Production web currently serves deployed app SHA `6ed152d`; this is expected for extension-only commits after that SHA.
- Pending local fix: extension repo-less OTel attribution for current Copilot 0.54 log records, plus QA log updates.
- Fixed VSIX has been packaged and installed locally from `apps/extension/copilot-tracker-0.0.1.vsix`.

## What Real QA Proved

- Real VS Code production sync handled no-task clear without stale task attribution.
- Manual override, branch-prompt accept, branch-prompt dismiss, and workspace-scoped prompt de-duplication were verified through real VS Code status/logs.
- The VS Code status bar/hover showed the selected task, current-session token split, total tokens, estimated cost, and dashboard click-through behavior.
- Production dashboard showed synced sessions, request grouping, task assignment, input/output token split, estimated cost, and Admin navigation.
- An Azure DevOps SSH-style workspace generated and synced a live Copilot request, but QA also exposed the global repo-less OTel attribution edge fixed in this patch.

## Bug Found And Fixed

- Current Copilot 0.54 JSONL log records can omit repository metadata while still carrying a Copilot chat `session.id` that matches VS Code chat-session storage.
- The extension previously filtered these repo-less records out for remote workspaces.
- The first fallback accepted repo-less records by timestamp-matched chat title, which was too broad: another VS Code workspace could admit the same global OTel request and overwrite production workspace/task fields by shared `requestRecordId`.
- Fix: `readCopilotOtelRequests` now resolves session identity before workspace filtering and accepts repo-less remote-workspace records only when Copilot's emitted chat `session.id` exactly matches that workspace's VS Code chat session id.
- Timestamp-only matching remains useful for session titles on records that already match repository metadata, but it cannot admit repo-less records.

## Other Extension Changes

- `copilot-tracker.otelFilePath` now reads only user/global configuration and ignores workspace values because Copilot's OTel exporter setting is global.
- Extension activation moved from `onStartupFinished` to `*` so exporter setup happens before Copilot Chat captures startup telemetry settings.
- README/package settings text now documents the user-level OTel path requirement.

## Validation Already Run

```bash
pnpm --filter ./apps/extension compile
pnpm --filter ./apps/extension test     # 40 passing
pnpm -r typecheck
pnpm -r lint
pnpm test                               # 11 smoke + 146 web + 40 extension
pnpm --filter ./apps/extension package
```

Additional validation:

- Replayed the patched parser against the real global OTel file and real VS Code workspace storage.
- Replay result: workspace A returned five relevant records; workspace B returned exactly one Azure-SSH chat request instead of the earlier cross-window set.
- Installed the fixed VSIX into real VS Code with the bundled `code --install-extension --force`.

## Still To Do In This Closeout

1. Run `pnpm smoke:production -- --allow-known-stale --expect-sha "$(git rev-parse --short HEAD)"` after the local commit is created.
2. Run `git diff --check`.
3. Commit and push the intended source/docs/test/QA-log files.
4. Watch GitHub Actions `CI` and `Build extension` until green.

## Files Expected In The Commit

- `apps/extension/README.md`
- `apps/extension/package.json`
- `apps/extension/src/chatSessionTitles.ts`
- `apps/extension/src/otel.ts`
- `apps/extension/src/test/extension.test.ts`
- `apps/extension/src/trackerClient.ts`
- `.codex/nightly-qa/CHANGES.md`
- `.codex/nightly-qa/FINDINGS.md`
- `.codex/nightly-qa/HANDOFF.md`
- `.codex/nightly-qa/LOOP_LOG.md`
- `.codex/nightly-qa/NEXT_AGENT_HANDOFF.md`
- `.codex/nightly-qa/STATUS.md`
- `.codex/nightly-qa/TEST_CASES.md`

## Operational Notes

- Do not record org values, keys, tokens, admin lists, API keys, client secrets, token encryption keys, webhook URLs, or auth/provider payloads.
- Use the safe public `auth_ref` only as a correlation id for auth failures.
- Dokploy may mark a build done while production still serves a previous SHA until app `Reload`; strict smoke catches this.
- Full local Docker image build remains blocked by unavailable Docker daemon on this machine.
