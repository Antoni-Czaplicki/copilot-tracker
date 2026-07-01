# Copilot Tracker

VS Code extension that tracks GitHub Copilot Chat token usage and attributes it
to your current workspace, repository, branch, and task.

It configures GitHub Copilot Chat to emit OpenTelemetry metadata to a local
JSONL file, reads that file, and forwards usage records to a
[Copilot Tracker server](https://github.com/Antoni-Czaplicki/copilot-tracker)
where they can be explored on a dashboard and leaderboard.

## Features

- Automatically configures Copilot Chat OTel file export.
- Attributes usage to the active task or the current Git branch.
- Syncs Copilot OTel sessions to your tracker server.

## Commands

- **Copilot Tracker: Set Current Task** — set the task usage is attributed to.
- **Copilot Tracker: Use Branch as Task** — attribute usage to the current branch.
- **Copilot Tracker: Sync Copilot OTel Now** — force an immediate sync.
- **Copilot Tracker: Open Dashboard** — open the tracker dashboard.
- **Copilot Tracker: Show Current Context** — inspect the active attribution.
- **Copilot Tracker: Show Logs** — open the extension log output.
- **Copilot Tracker: Sign In** — open the tracker web sign-in flow and store a tracker session token for the configured server origin.

## Settings

- `copilot-tracker.serverUrl` — Copilot Tracker server URL from user settings. Workspace values are ignored for token safety.
- `copilot-tracker.otelFilePath` — optional path for the OTel JSONL file.
- `copilot-tracker.syncIntervalSeconds` — fallback polling interval.
- `copilot-tracker.showCurrentSessionTokensInStatusBar` — show current session tokens and estimated cost in the status bar.

See the [project README](https://github.com/Antoni-Czaplicki/copilot-tracker)
and [INSTALL.md](https://github.com/Antoni-Czaplicki/copilot-tracker/blob/main/INSTALL.md)
for full setup instructions.

## License

[MIT](https://github.com/Antoni-Czaplicki/copilot-tracker/blob/main/LICENSE)
