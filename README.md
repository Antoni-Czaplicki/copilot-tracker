# Copilot Tracker

Monorepo for tracking GitHub Copilot Chat token usage by developer, workspace, repository, branch, task, session, and model.

For setup instructions, see [INSTALL.md](./INSTALL.md).

The project has three packages:

- `apps/extension` - VS Code extension that configures Copilot Chat OpenTelemetry and sends usage records.
- `apps/web` - Next.js app with ingestion API routes, Azure DevOps login, dashboard, authenticated leaderboard, admin views, and Drizzle/Postgres storage.
- `packages/shared` - shared TypeScript event and request contracts.

## Current Tracking Model

VS Code does not expose a stable public event that lets another extension listen to every built-in Copilot Chat request or response. The public Chat Participant API is for extensions that own their own participant, not for intercepting Copilot's built-in chat.

This extension uses GitHub Copilot Chat OpenTelemetry as the only capture source:

1. Configure Copilot Chat OTel with the file exporter.
2. Read the local OTel JSONL file.
3. Group spans by trace and extract `invoke_agent` or `chat` span metadata.
4. Send model, token, repository, branch, task, and timing metadata to the web server API.
5. Summarize the data by user, workspace, repository, branch, task, session, and model.

The extension sets Copilot OTel content capture to `false` and does not store prompts or responses.

## Task Detection

The default task is derived from the current Git branch using Azure DevOps numeric work item ids:

- `124` becomes `124`
- `124v2` becomes `124`
- `feature/456-login` becomes `456`
- `feature/ABC-123-login` becomes `123`
- `main` becomes `main`

Developers can override the selected task from the extension command. When the branch changes and the manual task no longer matches the branch-derived task, the extension asks whether to switch.

The web dashboard also lets users and admins reassign stored request records to a different task.

## Token Policy

Token usage is stored from Copilot Chat OpenTelemetry fields, primarily:

- `gen_ai.usage.input_tokens`
- `gen_ai.usage.output_tokens`
- `gen_ai.request.model`
- `gen_ai.response.model`
- `gen_ai.conversation.id`

When a root `invoke_agent` span does not include usage totals, the extension falls back to summing child `chat` span token usage. If OTel omits token counts entirely, the request is still stored but token counts remain `null`. This version does not estimate tokens for billing.

## Running Locally

Install dependencies:

```sh
pnpm install
```

Start Postgres and apply migrations:

```sh
docker compose up -d postgres
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker pnpm db:migrate
```

Build everything:

```sh
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker pnpm build
```

Start the web app:

```sh
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker pnpm dev:web
```

For local smoke testing without Azure DevOps OAuth or bearer-token validation:

```sh
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker COPILOT_TRACKER_AUTH_MODE=disabled pnpm dev:web
```

The web app runs on `http://localhost:3737`.

## Azure DevOps Login

Create a Microsoft Entra app registration with Azure DevOps delegated access and set:

```sh
NEXT_PUBLIC_APP_URL=http://localhost:3737
DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:54329/copilot_tracker
AZURE_DEVOPS_CLIENT_ID=your-azure-app-client-id
AZURE_DEVOPS_CLIENT_SECRET=your-azure-app-client-secret
AZURE_DEVOPS_ORG=your-azure-devops-org
AZURE_DEVOPS_TENANT_ID=organizations
COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY=replace-with-a-random-secret
ADMIN_AZURE_DEVOPS_LOGINS=your-work-email@example.com
COPILOT_TRACKER_AUTH_MODE=azure-devops
COPILOT_TRACKER_LEADERBOARD_ENABLED=true
GITHUB_COPILOT_BILLING_TOKEN=...
GITHUB_COPILOT_BILLING_SCOPE_TYPE=user
GITHUB_COPILOT_BILLING_SCOPE=your-github-login
CRON_SECRET=...
```

Use this callback URL in the app registration:

```text
http://localhost:3737/api/auth/callback/azure-devops
```

`AZURE_DEVOPS_CLIENT_ID`, `AZURE_DEVOPS_CLIENT_SECRET`, and `AZURE_DEVOPS_ORG` are required when `COPILOT_TRACKER_AUTH_MODE=azure-devops`.

The app requests Azure DevOps `vso.profile` and `vso.work` delegated scopes to read the signed-in user's profile, organization accounts, and work item metadata for task search. It also requests `offline_access` so the web session can refresh Azure DevOps work-item search tokens.

The extension signs in through VS Code's Microsoft authentication provider and the server validates that token against Azure DevOps before accepting usage. Background sync uses the profile scope silently; work-item search asks for work-item access when the user explicitly searches. Users can optionally map their Azure DevOps identity to a GitHub username for billing/reporting correlation.

`COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` is used to encrypt Azure DevOps session tokens at rest. If it is omitted, the app falls back to `AZURE_DEVOPS_CLIENT_SECRET`.

`apps/web/.env.example` contains the expected environment variables.

## Extension Commands

- `Copilot Tracker: Set Current Task`
- `Copilot Tracker: Use Branch as Task`
- `Copilot Tracker: Sync Copilot OTel Now`
- `Copilot Tracker: Sign In`
- `Copilot Tracker: Open Dashboard`
- `Copilot Tracker: Show Current Context`

## Extension Settings

- `copilot-tracker.serverUrl`
- `copilot-tracker.otelFilePath`
- `copilot-tracker.syncIntervalSeconds`
- `copilot-tracker.showCurrentSessionTokensInStatusBar`

## Web API

- `POST /api/events`
- `POST /api/chat-requests/batch`
- `PATCH /api/chat-requests/:requestRecordId`
- `GET /api/admin/export?type=tasks`
- `GET /api/admin/github-billing/sync`
- `GET /api/auth/azure-devops`
- `GET /api/auth/callback/azure-devops`
- `POST /api/auth/logout`

By default, ingest endpoints validate the VS Code Azure DevOps bearer token and configured organization membership. Set `COPILOT_TRACKER_AUTH_MODE=disabled` only for local development.

## Database

The web app stores users, sessions, tracker events, and Copilot chat request metadata in Postgres through Drizzle ORM.

Useful commands:

```sh
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

The schema lives in `apps/web/src/lib/db/schema.ts`, and generated migrations live in `apps/web/drizzle`.

## GitHub Billing Sync

The admin GitHub billing view can sync GitHub AI credit usage into Postgres. Configure:

```sh
GITHUB_COPILOT_BILLING_TOKEN=...
GITHUB_COPILOT_BILLING_SCOPE_TYPE=user # or organization, enterprise
GITHUB_COPILOT_BILLING_SCOPE=your-github-login-or-org-or-enterprise-slug
CRON_SECRET=...
```

Then schedule a daily request:

```sh
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3737/api/admin/github-billing/sync
```

Admins can also trigger the same sync from the GitHub billing tab in `/admin`.
