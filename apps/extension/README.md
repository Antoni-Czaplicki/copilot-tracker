# Copilot Tracker

VS Code extension that tracks GitHub Copilot Chat token usage and attributes it
to your current workspace, repository, branch, and task.

It configures GitHub Copilot Chat to emit OpenTelemetry metadata to a local
OTLP/HTTP receiver and forwards usage records to a
[Copilot Tracker server](https://github.com/Antoni-Czaplicki/copilot-tracker)
where they can be explored on a dashboard and leaderboard.

## Features

- Automatically configures local Copilot Chat OTel export.
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
- `copilot-tracker.otelHttpPort` — local loopback OTLP/HTTP receiver port. Defaults to `4318`.
- `copilot-tracker.showCurrentSessionTokensInStatusBar` — show current Copilot chat session token usage in the status bar.
- `copilot-tracker.taskBranchBaseBranches` — branches where manually switching tasks offers to switch to or create a task branch. Matching is case-insensitive. Defaults to `main`, `dev`, `beta`.
- `copilot-tracker.taskBranchNamePrefix` — optional prefix used for suggested task branch names when creating a branch from the task switch prompt.

## Multiple VS Code windows

Copilot Chat sends OTel telemetry from every window to the same local port, so
only one window can host the receiver at a time. The receiving window writes
all records to a shared spool file in the extension's global storage, and every
window (including ones that could not bind the port) reads that spool and keeps
only the requests that belong to its own workspace. Windows that lose the port
retry binding periodically and take over when the receiving window closes.

See the [project README](https://github.com/Antoni-Czaplicki/copilot-tracker)
and [INSTALL.md](https://github.com/Antoni-Czaplicki/copilot-tracker/blob/main/INSTALL.md)
for full setup instructions.

## License

[MIT](https://github.com/Antoni-Czaplicki/copilot-tracker/blob/main/LICENSE)
