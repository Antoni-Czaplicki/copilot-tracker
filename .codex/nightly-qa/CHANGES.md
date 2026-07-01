# Nightly QA Changes

## 2026-07-01 - Extension Task/Search/Dashboard Hardening

- Tightened `getTaskFromBranch` so detached commit labels and version-like branch names do not become false task IDs.
- Added branch parser regression assertions for prefixed work items, detached hashes, and version-style names.
- Guarded Azure DevOps Quick Pick async search updates after the picker settles, reducing race risk after accept/cancel/hide.
- Added active-editor-change context refresh so multi-root workspace task/branch status updates immediately when the active folder changes.
- Reused tracker server URL validation in `openDashboard` and surfaced malformed server URLs through a friendly VS Code error with settings/log actions.

## Checks

- PASS: `pnpm --filter ./apps/extension compile`
- PASS: `pnpm --filter ./apps/extension test`
- PASS: `pnpm -r typecheck`
- PASS: `pnpm -r lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env

## 2026-07-01 - OAuth Callback Failure Hardening

- Wrapped the Azure DevOps OAuth callback so all callback failures after entry clear PKCE/state cookies instead of leaving a half-open flow.
- Stopped reflecting provider `error_description` or other free-form diagnostics into public redirect URLs and homepage UI.
- Converted provider-denied/error callbacks to stable client-visible error codes.
- Preserved controlled failure redirects for invalid state, token exchange failures, profile/org check failures, misconfiguration, and unexpected callback failures.

## Checks

- PASS: `pnpm --filter @copilot-tracker/web typecheck`
- PASS: `pnpm --filter @copilot-tracker/web lint`
- PASS: `pnpm --filter @copilot-tracker/web build` with safe placeholder production env
