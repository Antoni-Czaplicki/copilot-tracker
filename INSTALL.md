# Install And Setup Guide

This guide explains how to install the VS Code extension, connect it to a
Copilot Tracker server, and verify that GitHub Copilot Chat usage is syncing.

## What You Need

- VS Code with GitHub Copilot Chat installed and signed in.
- Git installed, with the project opened from a Git repository in VS Code.
- Access to a Copilot Tracker server, for example
  `https://copilot-tracker.antek.page`.
- A packaged extension file, for example
  `apps/extension/copilot-tracker-0.0.1.vsix`.

The extension uses GitHub Copilot Chat OpenTelemetry as its only usage source.
It configures Copilot to write local OTel JSONL records, reads those records,
and sends usage metadata to the tracker server. Prompt and response content is
not captured.

## Install The Extension

From the repository root, install the packaged VSIX:

```sh
code --install-extension apps/extension/copilot-tracker-0.0.1.vsix --force
```

On macOS, if `code` is not available in your shell, use the VS Code app binary:

```sh
/Applications/Visual\ Studio\ Code.app/Contents/Resources/app/bin/code \
  --install-extension apps/extension/copilot-tracker-0.0.1.vsix \
  --force
```

After installing or updating the extension, reload VS Code:

1. Open the Command Palette.
2. Run `Developer: Reload Window`.

## Configure The Extension

Open VS Code user or workspace settings as JSON and set the tracker server URL:

```jsonc
{
  "copilot-tracker.serverUrl": "https://copilot-tracker.antek.page",
  "copilot-tracker.configureCopilotOtel": true,
  "copilot-tracker.otelFilePath": "",
  "copilot-tracker.syncIntervalSeconds": 15,
}
```

For local development, use the local web server instead:

```jsonc
{
  "copilot-tracker.serverUrl": "http://localhost:3737",
}
```

With `copilot-tracker.configureCopilotOtel` enabled, the extension configures
these Copilot Chat settings automatically:

```jsonc
{
  "github.copilot.chat.otel.enabled": true,
  "github.copilot.chat.otel.exporterType": "file",
  "github.copilot.chat.otel.outfile": "/path/to/copilot-otel.jsonl",
  "github.copilot.chat.otel.captureContent": false,
}
```

Leave `copilot-tracker.otelFilePath` empty unless you need a fixed OTel file
location. When it is empty, the extension stores the OTel file in VS Code global
storage.

## Verify Sync

In VS Code, run these commands from the Command Palette:

- `Copilot Tracker: Show Current Context`
- `Copilot Tracker: Sync Copilot OTel Now`
- `Copilot Tracker: Open Dashboard`
- `Copilot Tracker: Show Logs`

`Show Current Context` should display the workspace name, repository, remote,
branch, selected task, server URL, OTel file path, and last sync stats.

To test end to end:

1. Ask GitHub Copilot Chat a small question in VS Code.
2. Wait up to the configured sync interval, or run
   `Copilot Tracker: Sync Copilot OTel Now`.
3. Open the dashboard and check that the request appears in recent requests.

If Copilot's OTel record does not include usage fields, the dashboard can show
`missing` token counts for that request. The request is still synced.

## Select Tasks

The extension derives the default task from the current Git branch:

- `124` becomes `124`.
- `124v2` becomes `124`.
- `feature/456-login` becomes `456`.
- `feature/ABC-123-login` becomes `123`.
- `main` becomes `main`.

You can override the task with:

- `Copilot Tracker: Set Current Task`
- `Copilot Tracker: Use Branch as Task`

Stored requests can also be reassigned from the dashboard.

## Run The Web App Locally

Install dependencies:

```sh
pnpm install
```

Start Postgres and run migrations:

```sh
docker compose up -d postgres
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker pnpm db:migrate
```

Start the web app without Azure DevOps auth for local smoke testing:

```sh
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker \
COPILOT_TRACKER_AUTH_MODE=disabled \
pnpm dev:web
```

The local app runs at `http://localhost:3737`.

For Azure DevOps login, create a Microsoft Entra app registration with Azure
DevOps delegated access and configure:

```sh
NEXT_PUBLIC_APP_URL=http://localhost:3737
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker
AZURE_DEVOPS_CLIENT_ID=your-azure-app-client-id
AZURE_DEVOPS_CLIENT_SECRET=your-azure-app-client-secret
AZURE_DEVOPS_ORG=your-azure-devops-org
AZURE_DEVOPS_TENANT_ID=organizations
ADMIN_AZURE_DEVOPS_LOGINS=your-work-email@example.com
COPILOT_TRACKER_AUTH_MODE=azure-devops
GITHUB_COPILOT_BILLING_TOKEN=
GITHUB_COPILOT_BILLING_SCOPE_TYPE=user
GITHUB_COPILOT_BILLING_SCOPE=your-github-login
CRON_SECRET=
```

Use this OAuth callback URL:

```text
http://localhost:3737/api/auth/callback/azure-devops
```

`AZURE_DEVOPS_CLIENT_ID`, `AZURE_DEVOPS_CLIENT_SECRET`, and
`AZURE_DEVOPS_ORG` are required when
`COPILOT_TRACKER_AUTH_MODE=azure-devops`.

## Build And Package The Extension

From the repository root:

```sh
pnpm install
pnpm --filter ./apps/extension compile
cd apps/extension
npx --yes @vscode/vsce package --out copilot-tracker-0.0.1.vsix
```

The package is written to:

```text
apps/extension/copilot-tracker-0.0.1.vsix
```

Install it with the `code --install-extension` command from the first section.

## Troubleshooting

If no data appears on the dashboard:

1. Reload VS Code after installing or updating the extension.
2. Run `Copilot Tracker: Show Current Context`.
3. Confirm `copilot-tracker.serverUrl` points to the expected server.
4. Make a new Copilot Chat request.
5. Run `Copilot Tracker: Sync Copilot OTel Now`.
6. Check `Copilot Tracker: Show Logs`.

If the request is rejected by the server, make sure you are signed in to
Microsoft/Azure DevOps inside VS Code and that your account belongs to the
configured Azure DevOps organization. By default, the ingest API validates the
VS Code Azure DevOps bearer token before accepting usage.

If the extension keeps using `localhost`, set `copilot-tracker.serverUrl` in
settings and reload VS Code.

If you see duplicate extension installs, keep
`antoni-czaplicki.copilot-tracker` and uninstall any old package such as
`undefined_publisher.copilot-tracker`.

If token counts are `missing`, Copilot's OTel output did not include token usage
for that trace. The tracker does not estimate tokens.
