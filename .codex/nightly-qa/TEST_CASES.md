# Nightly QA Test Cases

Status legend: `PENDING`, `PASS`, `FAIL`, `BLOCKED`, `N/A`.

## Matrix

| ID | Category | Status | Scenario | Route | Notes |
|---|---|---|---|---|---|
| EXT-001 | Extension | PENDING | Command registration on activation includes all declared commands and returns disposables | Automated integration | |
| EXT-002 | Extension | PENDING | `onStartupFinished` path initializes context and sync lifecycle once | Automated integration | |
| EXT-003 | Extension | PENDING | Workspace folder change triggers `refreshContext` and context refresh | Automated integration | |
| EXT-004 | Extension | PENDING | `copilot-tracker.setTask` flow writes selected task and updates status | Automated unit/integration | |
| EXT-005 | Extension | PENDING | `copilot-tracker.useBranchTask` sets task from branch and syncs sessions | Automated | |
| EXT-006 | Extension | PENDING | `copilot-tracker.syncCopilotSessions` invokes sync immediately and updates `lastSyncStats` | Automated integration | |
| EXT-007 | Extension | PENDING | `syncCopilotSessions` ignores re-entrant calls and queues next run | Automated | |
| EXT-008 | Extension | PENDING | `pollForOtelChanges` no-op when OTel file signature unchanged | Automated | |
| EXT-009 | Extension | PENDING | OTel watcher triggers sync on change events | Automated | |
| EXT-010 | Extension | PENDING | OTel configuration auto-setup writes `outfile` and updates VS Code config when missing | Automated | |
| EXT-011 | Extension | PENDING | OTel file signature fails gracefully when file absent | Automated | |
| EXT-012 | Extension | PENDING | `buildWorkspaceContext` resolves repository root, remote URL, branch, default task | Automated | |
| EXT-013 | Extension | PASS | `getTaskFromBranch` handles numeric prefixes and branch-only fallback | Automated | Regression; `pnpm --filter ./apps/extension test` passed |
| EXT-014 | Extension | PASS | Branch parsing ignores non-task branch formats (`main`, `feature/foo`, versions, detached hashes) | Automated | Covered by new unit assertions; `pnpm --filter ./apps/extension test` passed |
| EXT-015 | Extension | PENDING | `setSelectedTask` persists per-workspace and later load reflects it | Automated | |
| EXT-016 | Extension | PENDING | `refreshContext` fallback when remote URL unavailable and branch available | Automated | |
| EXT-017 | Extension | PENDING | `maybePromptForBranchTask` prompt appears only when branch-based task changes from manual selection | Automated | Edge |
| EXT-018 | Extension | PENDING | Status bar text reflects current session token totals and handles zero-metrics state | Automated/manual | |
| EXT-019 | Extension | PENDING | Sign-in command handles missing trusted-server signature and prompts auth flow | Automated | |
| EXT-020 | Extension | PENDING | `syncCopilotSessions` sends `session-sync-failed` event on parser/network failure | Automated + API mock | |
| API-021 | API/Backend | PENDING | `POST /api/events` returns 401 with no auth token when auth disabled is false | Automated integration | |
| API-022 | API/Backend | PENDING | `POST /api/events` accepts valid event payload and returns 202 | Automated | |
| API-023 | API/Backend | PENDING | `POST /api/events` invalid payload returns 400 | Automated | |
| API-024 | API/Backend | PENDING | `POST /api/events` malformed JSON returns structured parse error instead of 500 | Automated | |
| API-025 | API/Backend | PENDING | `POST /api/events` persists user login/id from authenticated user | Automated + DB | |
| API-026 | API/Backend | PENDING | `POST /api/events` duplicates by `eventId` are idempotent | Automated + DB | |
| API-027 | API/Backend | PENDING | `POST /api/events` in disabled auth mode maps to local dev user | Automated | |
| API-028 | API/Backend | PENDING | `POST /api/chat-requests/batch` unauthenticated returns 401 | Automated | |
| API-029 | API/Backend | PENDING | `POST /api/chat-requests/batch` valid payload returns 202 and reported counts | Automated | |
| API-030 | API/Backend | PENDING | `POST /api/chat-requests/batch` malformed payload returns 400 | Automated | |
| API-031 | API/Backend | PENDING | `POST /api/chat-requests/batch` over-max array returns 400 | Automated | |
| API-032 | API/Backend | PENDING | Batch ingest dedupes duplicate `requestRecordId` in same payload | Automated + DB | |
| API-033 | API/Backend | PENDING | Batch ingest preserves richer request data when duplicates conflict | Automated property/domain | |
| API-034 | API/Backend | PENDING | Batch ingest computes `totalTokens` and `tokenSource` for normal/partial/missing data | Automated | |
| API-035 | API/Backend | PENDING | Batch ingest sets default `promptTokenDetails` and `stopReasons` when null | Automated | |
| API-036 | API/Backend | PENDING | `upsertChatRequests` keeps existing tokens when new row has null totals | Automated + DB | |
| API-037 | API/Backend | PENDING | Batch ingest preserves meaningful `selectedTask` during dedupe/upsert | Automated | Regression |
| API-038 | API/Backend | PENDING | `PATCH /api/chat-requests/bulk` unauthorized returns 401 | Automated | |
| API-039 | API/Backend | PENDING | Bulk update invalid payload returns 400 | Automated | |
| API-040 | API/Backend | PENDING | Bulk update with neither IDs nor sessionId returns 400 | Automated | |
| API-041 | API/Backend | PENDING | Bulk update by request IDs updates only listed rows | Automated + DB | |
| API-042 | API/Backend | PENDING | Bulk update by sessionId updates all rows in session | Automated + DB | |
| API-043 | API/Backend | PENDING | Bulk request list over 500 returns no DB write | Automated | Regression |
| API-044 | API/Backend | PENDING | Non-admin user cannot update another user's rows | Automated + DB | |
| API-045 | API/Backend | PENDING | Admin user can bulk update across users | Automated + DB | |
| API-046 | API/Backend | PENDING | Duplicate IDs in bulk request are deduped before update | Automated | |
| API-047 | API/Backend | PENDING | `PATCH /api/chat-requests/[requestRecordId]` unauthorized returns 401 | Automated | |
| API-048 | API/Backend | PENDING | Single-row task patch invalid body returns 400 | Automated | |
| API-049 | API/Backend | PENDING | Single-row task patch non-existent id returns 404 | Automated | |
| API-050 | API/Backend | PENDING | Single-row task patch updates exactly one record | Automated + DB | |
| API-051 | API/Backend | PENDING | Single-row task patch accepts only `selectedTask` and ignores extras | Automated | |
| API-052 | API/Backend | PENDING | Work-items API with empty query returns `{workItems: []}` | Automated | |
| API-053 | API/Backend | PENDING | Work-items bearer path uses ingest token auth | Automated + mock headers | |
| API-054 | API/Backend | PENDING | Work-items session cookie path reads session token cache | Automated | |
| API-055 | API/Backend | PENDING | Work-items route unauthorized when no token/session | Automated | |
| API-056 | API/Backend | PENDING | Work-items upstream 401/403/429 mapped unchanged | Automated | |
| API-057 | API/Backend | PENDING | Work-items other upstream errors map to 502 | Automated | |
| API-058 | API/Backend | PENDING | Admin export non-admin returns 401 | Automated | |
| API-059 | API/Backend | PENDING | Admin export developers type has filename/content headers | Automated | |
| API-060 | API/Backend | PENDING | Admin export tasks type includes cost and repo/branch columns | Automated | |
| API-061 | API/Backend | PENDING | Admin export developer-tasks aggregates correctly | Automated | |
| API-062 | API/Backend | PENDING | Admin export models type includes expected headers/rows | Automated | |
| API-063 | API/Backend | PASS | Admin export unknown type returns 400 after validation | Automated | Implemented route validation; build/lint/typecheck passed |
| API-064 | API/Backend | PENDING | CSV escaping handles quotes, commas, and newlines | Automated | |
| API-065 | API/Backend | PENDING | Export uses filtered meaningful requests for aggregate tabs | Automated | |
| API-066 | API/Backend | PENDING | Billing sync admin path returns sync result | Automated | |
| API-067 | API/Backend | PENDING | Billing sync POST aliases GET behavior if retained | Automated | |
| API-068 | API/Backend | PENDING | Billing sync cron secret bearer works and missing secret fails | Automated | |
| API-069 | API/Backend | PENDING | User GitHub login patch validates and normalizes usernames | Automated | |
| API-070 | API/Backend | PASS | User GitHub login patch malformed JSON returns 400 | Automated | Implemented route validation; build/lint/typecheck passed |
| API-071 | API/Backend | PENDING | Updating user GitHub login cascades to chat requests and events | Automated + DB | |
| API-072 | API/Backend | PENDING | `readUserBySessionId` deletes/invalidates expired sessions | Automated | |
| API-073 | API/Backend | PENDING | `readSessionAzureDevOpsTokens` returns null on decryption failure | Automated | |
| API-074 | API/Backend | PENDING | Token cache refreshes near-expiry token using refresh token path | Automated | |
| API-075 | API/Backend | PENDING | Refresh-token failure clears stored tokens | Automated | |
| API-076 | API/Backend | PENDING | `updateSessionAzureDevOpsTokens` persists refreshed tokens and expiresAt | Automated | |
| API-077 | API/Backend | PENDING | `insertTrackerEvent` stores null payload and user refs correctly | Automated + DB | |
| API-078 | API/Backend | PENDING | `readDatabase` maps stored rows consistently | Automated | |
| API-079 | API/Backend | PENDING | Session token encryption uses key when configured and avoids plaintext | Automated | Edge |
| API-080 | API/Backend | PENDING | Decrypt rejects malformed encrypted format safely | Automated | |
| API-081 | API/Backend | PENDING | Remote normalization is deterministic | Automated | |
| API-082 | API/Backend | PENDING | Stored chat/event mapping preserves nullable fields | Automated | |
| API-083 | API/Backend | PENDING | `readChatRequestsForUser` returns only caller rows | Automated | |
| API-084 | API/Backend | PENDING | `upsertUser` updates lastSeenAt/role while preserving primary key | Automated + DB | |
| API-085 | API/Backend | PENDING | Disabled auth mode short-circuits API auth cleanly across endpoints | Automated | |
| API-086 | API/Backend | PENDING | Events and chat batch reject missing workspaceId | Automated | |
| API-087 | API/Backend | PENDING | Concurrent upsert/read does not produce invalid tokenSource state | Automated | Edge |
| AUTH-088 | Auth | PENDING | `secureCookieOptions` chooses secure based on app URL scheme | Automated | |
| AUTH-089 | Auth | PENDING | `expiredCookieOptions` emits removal-safe attributes | Automated | |
| AUTH-090 | Auth | PENDING | Disabled mode `currentUser` returns local-dev admin | Automated | |
| AUTH-091 | Auth | PENDING | Ingest auth missing/garbled Bearer returns null | Automated | |
| AUTH-092 | Auth | PENDING | PKCE challenge outputs URL-safe verifier/challenge pair | Automated | |
| AUTH-093 | Auth | PENDING | Token exchange error response maps to `AzureDevOpsTokenExchangeError` | Automated | |
| AUTH-094 | Auth | PENDING | OAuth start missing config redirects `/?auth=misconfigured` | Automated | |
| AUTH-095 | Auth | PENDING | OAuth start sets PKCE cookies with 10-minute expiry | Automated | |
| AUTH-096 | Auth | PENDING | Callback provider error redirects failed state and clears OAuth cookies | Automated | |
| AUTH-097 | Auth | PENDING | Callback state mismatch redirects invalid state and clears cookies | Automated | Security |
| AUTH-098 | Auth | PENDING | Callback missing code/verifier fails with invalid OAuth state | Automated | |
| AUTH-099 | Auth | PENDING | Callback token exchange failure redirects proper auth failure | Automated | |
| AUTH-100 | Auth | PENDING | Callback token exchange exception class path preserves useful safe details | Automated | |
| AUTH-101 | Auth | PENDING | Callback profile/org failure redirects `profile_or_org_check_failed` | Automated | |
| AUTH-102 | Auth | PENDING | Callback success creates/loads session and redirects `/dashboard` | Automated | Regression |
| AUTH-103 | Auth | PENDING | Logout clears session cookie and deletes session row | Automated + DB | |
| AUTH-104 | Auth | PENDING | Azure profile fetch handles missing fields/bad JSON safely | Automated | |
| AUTH-105 | Auth | PENDING | Org membership checks accountName and URI-containing forms | Automated | |
| AUTH-106 | Auth | PENDING | Org membership non-200 upstream returns false | Automated | |
| AUTH-107 | Auth | PENDING | Invalid token expiry is treated as near-expiry and refreshes | Automated | |
| AUTH-108 | Auth | PENDING | Token refresh fetch timeout aborts safely | Automated/integration | Edge |
| UI-109 | Web | PENDING | Home page for logged-in user renders dashboard cards and task list | Playwright + fixture | |
| UI-110 | Web | PENDING | Logged-out home renders auth CTAs and auth error states | Playwright | |
| UI-111 | Web | PENDING | Home parses auth params and taskPage safely | Automated | |
| UI-112 | Web | PENDING | `/dashboard` redirects to `/` if not logged in | Automated | |
| UI-113 | Web | PENDING | `taskPage` clamps invalid/non-positive values to 1 | Automated | |
| UI-114 | Web | PENDING | `/admin` redirects non-admin users to `/` | Automated | |
| UI-115 | Web | PENDING | Admin unknown view falls back to overview and active nav is correct | Automated | |
| UI-116 | Web | PENDING | `/leaderboard` returns notFound when feature flag disabled | Automated | |
| UI-117 | Web | PENDING | Request sessions grid groups by session, sorts newest first, focuses `sessionId` | Automated | |
| UI-118 | Web | PENDING | Selection flow sends expected payload for selected requests/session | Automated | |
| UI-119 | Web | PENDING | WorkItemPicker searches only for query >=2 chars or digits-only | Component + MSW | |
| UI-120 | Web | PENDING | WorkItemPicker debounce prevents extra calls and Enter selects highlighted item | Component | |
| UI-121 | Web | PENDING | WorkItemPicker Escape and arrow keys preserve listbox semantics | Component | |
| UI-122 | Web | PENDING | TaskEditor/GitHubLoginEditor idle/saving/saved/error transitions | Component | Regression |
| UI-123 | Web | PENDING | Admin export link changes with selected view | Automated | |
| UI-124 | Web | PENDING | Request grid pagination and empty messages render correctly | Automated | |
| UI-125 | Web | PENDING | Token display differentiates missing vs partial Copilot OTel data | Automated | |
| DEP-126 | Deployment | PENDING | Docker build runs shared then web build and includes runtime assets | Container build | |
| DEP-127 | Deployment | PENDING | Docker migration loop retries before exit and starts app on `:3737` | Manual + smoke | |
| DEP-128 | Deployment | PENDING | Compose DB healthcheck transitions green before app connects | Compose smoke | |
| DEP-129 | Deployment | PENDING | Missing DB connectivity fails predictably during migration attempts | Manual/chaos | |
| DEP-130 | Deployment | PENDING | Required env vars/args are read and propagated | Config contract | |
| DEP-131 | Deployment | PENDING | Default ports are consistent end-to-end | Automated | |
| DEP-132 | Deployment | PENDING | Production OAuth start is reachable without localhost assumptions | Manual/browser | |
| DEP-133 | Deployment | PENDING | CI includes web production build guardrail | Pipeline review | Finding target |
| DEP-134 | Deployment | PENDING | Extension packaging workflow compiles and packages VSIX | Workflow/manual | |
| DEP-135 | Deployment | PENDING | Extension tests run headless under Xvfb without flake | CI validation | |
| DEP-136 | Deployment | PENDING | Schema migration is idempotent across container restarts | Integration | |
| DEP-137 | Deployment | PASS | `/api/health` returns readiness status, DB status, build SHA, and timestamp | Local `next start` smoke | Returned 503 with DB unavailable and build metadata present |
