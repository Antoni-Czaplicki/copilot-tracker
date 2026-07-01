# Deployment Contract

This app is deployed as the root `Dockerfile` image. The production container
must expose port `3737` and must run with `NODE_ENV=production`.

## Required Runtime Environment

Set these variables in the deployment platform without committing their values:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `COPILOT_TRACKER_AUTH_MODE=azure-devops`
- `AZURE_DEVOPS_CLIENT_ID`
- `AZURE_DEVOPS_CLIENT_SECRET`
- `AZURE_DEVOPS_ORG`
- `AZURE_DEVOPS_TENANT_ID`
- `ADMIN_AZURE_DEVOPS_LOGINS`
- `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY`

Optional production features:

- `COPILOT_TRACKER_LEADERBOARD_ENABLED`
- `GITHUB_COPILOT_BILLING_TOKEN`
- `GITHUB_COPILOT_BILLING_SCOPE_TYPE`
- `GITHUB_COPILOT_BILLING_SCOPE`
- `CRON_SECRET`

## Build Metadata

Pass build metadata as Docker build args and runtime environment variables so
`/api/health` can identify the exact deployed revision:

```sh
COPILOT_TRACKER_BUILD_SHA=$(git rev-parse --short HEAD)
COPILOT_TRACKER_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
```

In Dokploy or another Docker builder, map those values to:

- build arg `COPILOT_TRACKER_BUILD_SHA`
- build arg `COPILOT_TRACKER_BUILD_TIME`
- runtime env `COPILOT_TRACKER_BUILD_SHA`
- runtime env `COPILOT_TRACKER_BUILD_TIME`

If production reports `version.sha="unknown"`, the deploy cannot be tied back
to a commit from the health endpoint.

## Azure App Registration

The Microsoft Entra app registration must include this redirect URI:

```text
https://copilot-tracker.antek.page/api/auth/callback/azure-devops
```

The app must allow delegated Azure DevOps access for:

- `offline_access`
- `vso.profile`
- `vso.work`

If the real login returns `auth_code=invalid_client`, check the Azure client ID,
client secret, tenant/account type, and redirect URI before debugging app code.

## Production Smoke Checks

Run these checks after each deploy:

```sh
curl -fsS https://copilot-tracker.antek.page/api/health
curl -I https://copilot-tracker.antek.page/
curl -I https://copilot-tracker.antek.page/api/auth/azure-devops
```

Expected results:

- `/api/health` returns HTTP 200 with `ok=true`, `database.ok=true`, and a
  non-`unknown` `version.sha`.
- `/` returns HTTP 200.
- `/api/auth/azure-devops` redirects to Microsoft with PKCE
  `code_challenge_method=S256` and scopes including `offline_access`,
  `vso.profile`, and `vso.work`.
- Provider-error callbacks must not reflect provider descriptions into public
  URLs or page text.

## Local Container Smoke

When Docker is available:

```sh
COPILOT_TRACKER_BUILD_SHA=$(git rev-parse --short HEAD) \
COPILOT_TRACKER_BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
docker compose up --build app
```

The compose app uses local placeholder Azure values for image build validation.
Use real Azure values only in runtime environment variables when exercising
login flows.
