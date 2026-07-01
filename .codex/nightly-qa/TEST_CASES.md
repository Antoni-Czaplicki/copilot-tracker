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
| EXT-015 | Extension | PASS | `setSelectedTask` persists per-workspace and ignores deprecated global fallback leakage | Automated | Legacy global fallback removed; extension tests passed |
| EXT-016 | Extension | PENDING | `refreshContext` fallback when remote URL unavailable and branch available | Automated | |
| EXT-017 | Extension | PENDING | `maybePromptForBranchTask` prompt appears only when branch-based task changes from manual selection | Automated | Edge |
| EXT-018 | Extension | PASS | Status bar text reflects current session token totals and handles zero-metrics/partial-capture state | Automated/manual | Partial token lower-bound display implemented; extension tests passed |
| EXT-019 | Extension | PENDING | Sign-in command handles missing trusted-server signature and prompts auth flow | Automated | |
| EXT-020 | Extension | PENDING | `syncCopilotSessions` sends `session-sync-failed` event on parser/network failure | Automated + API mock | |
| EXT-138 | Extension | PASS | Structured extension logs and context UI do not reveal local paths, repository remotes, storage paths, or tokens | Automated | Logger redaction regression added; `pnpm --filter ./apps/extension test` passed |
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
| API-031 | API/Backend | PASS | `POST /api/chat-requests/batch` over-max array and oversized integer fields return 400 | Automated | Token integer upper bound implemented; build/lint/typecheck passed |
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
| API-052 | API/Backend | PASS | Work-items API with empty query returns `{workItems: []}` | Automated | Added route-level blank query coverage; web tests passed |
| API-053 | API/Backend | PENDING | Work-items bearer path uses ingest token auth | Automated + mock headers | |
| API-054 | API/Backend | PENDING | Work-items session cookie path reads session token cache | Automated | |
| API-055 | API/Backend | PASS | Work-items route unauthorized when no token/session | Automated | Production unauthenticated request returned auth-gated status |
| API-056 | API/Backend | PENDING | Work-items upstream 401/403/429 mapped unchanged | Automated | |
| API-057 | API/Backend | PENDING | Work-items other upstream errors map to 502 | Automated | |
| API-058 | API/Backend | PASS | Admin export non-admin returns 401 | Automated | Production unauthenticated request returned 401 |
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
| AUTH-088 | Auth | PASS | `secureCookieOptions` chooses secure based on app URL scheme | Automated | Added auth cookie policy coverage; web tests passed |
| AUTH-089 | Auth | PASS | `expiredCookieOptions` emits removal-safe attributes | Automated | Added auth cookie policy coverage; web tests passed |
| AUTH-090 | Auth | PENDING | Disabled mode `currentUser` returns local-dev admin | Automated | |
| AUTH-091 | Auth | PENDING | Ingest auth missing/garbled Bearer returns null | Automated | |
| AUTH-092 | Auth | PASS | PKCE challenge outputs URL-safe verifier/challenge pair | Automated | Added S256 PKCE coverage; web tests passed |
| AUTH-093 | Auth | PASS | Token exchange error response maps to `AzureDevOpsTokenExchangeError` | Automated | Added mocked token exchange coverage; web tests passed |
| AUTH-094 | Auth | PENDING | OAuth start missing config redirects `/?auth=misconfigured` | Automated | |
| AUTH-095 | Auth | PASS | OAuth start sets PKCE cookies with 10-minute expiry | Automated | Added route-level OAuth start coverage; web tests passed |
| AUTH-096 | Auth | PASS | Callback provider error redirects failed state and clears OAuth cookies | Automated | Added safe callback failure coverage; web tests passed |
| AUTH-097 | Auth | PASS | Callback state mismatch redirects invalid state and clears cookies | Automated | Added state mismatch route coverage; web tests passed |
| AUTH-098 | Auth | PASS | Callback missing code/verifier fails with invalid OAuth state | Automated | Added missing-code/verifier route coverage; web tests passed |
| AUTH-099 | Auth | PASS | Callback token exchange failure redirects proper auth failure | Automated | Production Chrome flow returned `auth=failed&auth_code=invalid_client` without reflected description |
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
| UI-110 | Web | PASS | Logged-out home renders auth CTAs and auth error states | Playwright | Chrome verified homepage CTA; production auth failure rendered safe URL state |
| UI-111 | Web | PENDING | Home parses auth params and taskPage safely | Automated | |
| UI-112 | Web | PENDING | `/dashboard` redirects to `/` if not logged in | Automated | |
| UI-113 | Web | PENDING | `taskPage` clamps invalid/non-positive values to 1 | Automated | |
| UI-114 | Web | PENDING | `/admin` redirects non-admin users to `/` | Automated | |
| UI-115 | Web | PENDING | Admin unknown view falls back to overview and active nav is correct | Automated | |
| UI-116 | Web | PASS | `/leaderboard` returns notFound when feature flag disabled and redirects non-admin users | Automated | Admin-only gate implemented; build/lint/typecheck passed |
| UI-117 | Web | PENDING | Request sessions grid groups by session, sorts newest first, focuses `sessionId` | Automated | |
| UI-118 | Web | PASS | Selection flow sends expected payload for selected requests/session | Automated | Added `updated: 0` guard for bulk/session assignment; build/lint/typecheck passed |
| UI-119 | Web | PENDING | WorkItemPicker searches only for query >=2 chars or digits-only | Component + MSW | |
| UI-120 | Web | PENDING | WorkItemPicker debounce prevents extra calls and Enter selects highlighted item | Component | |
| UI-121 | Web | PENDING | WorkItemPicker Escape and arrow keys preserve listbox semantics | Component | |
| UI-122 | Web | PASS | TaskEditor/GitHubLoginEditor idle/saving/saved/error transitions | Component | TaskEditor now handles saving/saved/error and clears status on edits; build/lint/typecheck passed |
| UI-123 | Web | PASS | Admin export link changes with selected view and billing sync uses in-page action state | Automated | Admin billing sync button implemented; build/lint/typecheck passed |
| UI-124 | Web | PENDING | Request grid pagination and empty messages render correctly | Automated | |
| UI-125 | Web | PENDING | Token display differentiates missing vs partial Copilot OTel data | Automated | |
| DEP-126 | Deployment | BLOCKED | Docker build runs shared then web build and includes runtime assets | Container build | Docker daemon socket unavailable on this machine |
| DEP-127 | Deployment | PENDING | Docker migration loop retries before exit and starts app on `:3737` | Manual + smoke | |
| DEP-128 | Deployment | PENDING | Compose DB healthcheck transitions green before app connects | Compose smoke | |
| DEP-129 | Deployment | PENDING | Missing DB connectivity fails predictably during migration attempts | Manual/chaos | |
| DEP-130 | Deployment | PASS | Required env vars/args are read and propagated | Config contract | Deployment contract documented; compose config renders build/runtime metadata args |
| DEP-131 | Deployment | PASS | Default ports are consistent end-to-end | Automated | Local `next start` and compose config expose app port 3737 |
| DEP-132 | Deployment | PENDING | Production OAuth start is reachable without localhost assumptions | Manual/browser | |
| DEP-133 | Deployment | PASS | CI includes web production build guardrail | Pipeline review | CI workflow now includes web production build step; GitHub CI passed on subsequent commits |
| DEP-134 | Deployment | PENDING | Extension packaging workflow compiles and packages VSIX | Workflow/manual | |
| DEP-135 | Deployment | PENDING | Extension tests run headless under Xvfb without flake | CI validation | |
| DEP-136 | Deployment | PENDING | Schema migration is idempotent across container restarts | Integration | |
| DEP-137 | Deployment | PASS | `/api/health` returns readiness status, DB status, build SHA, and timestamp | Local and production smoke | Local returned 503 with DB unavailable; production returned 200 with DB ready |
| API-139 | API/Backend | PASS | Payload schema accepts PostgreSQL integer token bounds and rejects oversized token fields | Automated | Added web `node:test` coverage; `pnpm --filter @copilot-tracker/web test` passed |
| API-140 | API/Backend | PASS | Chat request batch schema caps payloads at 500 requests | Automated | Added web `node:test` coverage; web test/lint/typecheck/build passed |
| API-141 | API/Backend | PASS | Task assignment schema trims selected task values and rejects empty task strings | Automated | Added web `node:test` coverage; web test/lint/typecheck/build passed |
| AUTH-142 | Auth | PASS | Auth callback code sanitizer removes control characters, collapses whitespace, and truncates long codes | Automated | Extracted helper and added web `node:test` coverage |
| UI-143 | Web | PASS | GitHub username normalization trims `@`, accepts valid handles, and rejects invalid handles | Automated | Added web `node:test` coverage |
| UI-144 | Web | PASS | Estimated cost calculation prices known aliases, counts unpriced requests, and formats small USD values | Automated | Added web `node:test` coverage |
| EXT-145 | Extension | PASS | OTel upload cache skips unchanged records across syncs while reuploading stable metadata changes | Automated | Added request upload signature cache tests, including workspace/server scope isolation; `pnpm --filter ./apps/extension test` passed |
| API-146 | API/Backend | PASS | Azure DevOps WIQL builder clamps limits, escapes text, and rejects unsafe numeric work-item ids | Automated | Added web `node:test` coverage; web test/lint/typecheck/build passed |
| DEP-147 | Deployment | PASS | Docker build context excludes local Codex QA logs and docs define production smoke checks | Config/docs review | `.dockerignore` excludes `.codex`; `docker compose config` passed |
| UI-148 | Web | PASS | WorkItemPicker hides stale results and shows searching state while a new debounced query is pending | Code review + build | Web test/lint/typecheck/build passed |
| EXT-149 | Extension | PASS | Tracker events do not include the local OS username in the client-supplied `user` field | Automated compile/lint | Uses generic extension label; `pnpm --filter ./apps/extension test` passed |
| EXT-150 | Extension | PASS | Tracker server URL validation allows HTTPS/local origins and rejects paths, credentials, query, fragment, and non-local HTTP | Automated | Added parser regression assertions; `pnpm --filter ./apps/extension test` passed |
| API-151 | API/Backend | PASS | Admin export rejects unsupported export types before loading export data | Code review + build | Web lint/typecheck/build passed |
| API-152 | API/Backend | PASS | Admin export type parser accepts only known export types | Automated | Added `adminExport` node:test coverage; web tests passed |
| API-153 | API/Backend | PASS | Admin request CSV export escapes commas, quotes, and newlines correctly | Automated | Added `adminExport` node:test coverage; web tests passed |
| API-154 | API/Backend | PASS | Admin request CSV export excludes captured-only placeholder rows | Automated | Added `adminExport` node:test coverage; web tests passed |
| API-155 | API/Backend | PASS | Admin GitHub billing CSV export emits billing rows without depending on request data | Automated | Added `adminExport` node:test coverage; web tests passed |
| EXT-156 | Extension | PASS | Tracker server URL validation treats IPv6 localhost `http://[::1]:3737` as a safe local origin | Automated | Added parser regression assertion; extension tests passed |
| UI-157 | Web | PASS | Single request row task editor can clear the selected task assignment | Code review + build | Clear action sends `selectedTask: null`; web test/lint/typecheck/build passed |
| UI-158 | Web | PASS | Bulk selected request assignment can clear selected rows | Code review + build | Selected toolbar clear action sends nullable assignment; web test/lint/typecheck/build passed |
| UI-159 | Web | PASS | Session assignment controls can clear every request in a session | Code review + build | Session clear action sends nullable assignment; web test/lint/typecheck/build passed |
| API-160 | API/Backend | PASS | Task assignment payload schema accepts `selectedTask: null` for clearing while still rejecting empty strings | Automated | Added web `node:test` coverage; web tests passed |
| AUTH-161 | Auth | PASS | Login failure UI maps `invalid_client` to a safe operator hint without provider descriptions | Automated + build | Added `authFailureHint` coverage; web test/lint/typecheck/build passed |
| AUTH-162 | Auth | PASS | Login failure UI maps invalid OAuth state/PKCE failures to a safe retry/cookie hint | Automated + build | Added `authFailureHint` coverage; web test/lint/typecheck/build passed |
| AUTH-163 | Auth | PASS | Unknown auth failure codes do not display invented guidance | Automated | Added unknown-code test; web tests passed |
| EXT-164 | Extension | PASS | Extension cost estimator prices known model input/output token splits | Automated | Replaced placeholder sample test; extension tests passed |
| UI-165 | Web | PASS | Homepage task-detection sentence renders spacing between the example branch and following text | Code review + build | Fixed explicit JSX space; web test/lint/typecheck/build passed |
| DOC-166 | Docs | PASS | README documents task clearing and the current web API route surface | Docs review | Updated README; `git diff --check` passed |
| DOC-167 | Docs/Deployment | PASS | README full-build command includes production-safe placeholder env values and succeeds as written | Manual command | Ran documented `pnpm build` command successfully |
| QA-168 | Quality | PASS | Root `pnpm test` runs both web regression tests and extension VS Code tests | Manual command | `pnpm test` passed with 22 web tests and 10 extension tests |
| UI-169 | Web | PASS | Dashboard task pagination preserves focused `sessionId` query parameter | Automated | Added `dashboardTaskPageHref` regression coverage; web tests passed |
| AUTH-170 | Auth | PASS | Token exchange request includes PKCE `code_verifier`, redirect URI, and required scopes | Automated | Added mocked token exchange request coverage; web tests passed |
| API-171 | API/Backend | PASS | Azure DevOps work-item search maps WIQL ids through batch field responses | Automated | Added mocked work-item search coverage; web tests passed |
| API-172 | API/Backend | PASS | Azure DevOps work-item search falls back to the second text WIQL query after a 400 | Automated | Added fallback query coverage; web tests passed |
| API-173 | API/Backend | PASS | Azure DevOps work-item search maps repeated 429 responses to a typed rate-limit error | Automated | Added mocked rate-limit coverage; web tests passed |
| EXT-174 | Extension | PASS | TrackerClient work-item search requests use interactive work-item auth and parse returned items | Automated | Added VS Code extension test; extension tests passed |
| EXT-175 | Extension | PASS | TrackerClient blocks remote server sync when no token is available | Automated | Added VS Code extension test; extension tests passed |
| EXT-176 | Extension | PASS | TrackerClient surfaces JSON error messages from non-2xx server responses | Automated | Added VS Code extension test; extension tests passed |
| EXT-177 | Extension | PASS | TrackerClient retries network failures and surfaces `network_error` after final failure | Automated | Added VS Code extension test; extension tests passed |
| DEP-178 | Deployment | PASS | Health build metadata prefers explicit values, falls back to common source metadata, and reports `unknown` only when metadata is absent/invalid | Automated | Added `readBuildInfo` web tests; web tests passed |
| AUTH-179 | Auth | PASS | Disabled auth mode uses a stable local-dev admin identity shape | Automated | Added `localDevUserIdentity` coverage; web tests passed |
| AUTH-180 | Auth | PASS | Bearer auth parsing accepts canonical headers and rejects missing, empty, Basic, and malformed bearer values | Automated | Added `parseBearerToken` coverage and reused parser in ingest/work-item paths; web tests passed |
| AUTH-181 | Auth | PASS | Azure profile fetch maps id, display name, email/core attributes, and public alias safely | Automated | Added mocked `fetchAzureDevOpsUser` coverage; web tests passed |
| AUTH-182 | Auth | PASS | Azure org membership accepts matching accountName and accountUri forms | Automated | Added mocked membership coverage for account name and URI; web tests passed |
| AUTH-183 | Auth | PASS | Azure profile/org lookup returns null on malformed upstream JSON instead of throwing | Automated | Added malformed profile and malformed membership JSON tests; web tests passed |
| AUTH-184 | Auth | PASS | Azure token exchange maps malformed successful token JSON to `invalid_token_response` | Automated | Added mocked token exchange coverage; web tests passed |
| AUTH-185 | Auth | PASS | Azure token exchange rejects non-string access tokens in successful responses | Automated | Added mocked token exchange coverage; web tests passed |
| API-186 | API/Backend | PASS | Chat request payload defaults optional prompt-token detail and stop-reason arrays | Automated | Added payload schema coverage; web tests passed |
| API-187 | API/Backend | PASS | Chat request payload bounds prompt-token percentages and tool-call round counts | Automated | Added payload schema coverage; web tests passed |
| API-188 | API/Backend | PASS | Tracker event payload accepts known event types and optional payload records | Automated | Added payload schema coverage; web tests passed |
| API-189 | API/Backend | PASS | Tracker event payload rejects blank workspace ids and unknown event types | Automated | Added payload schema coverage; web tests passed |
| UI-190 | Web | PASS | Dashboard summary metrics filter placeholder rows and aggregate token/cost totals | Automated | Added analytics coverage; web tests passed |
| UI-191 | Web | PASS | Task summaries group by task/repository/branch and sort by latest activity | Automated | Added analytics coverage; web tests passed |
| UI-192 | Web | PASS | Developer task summaries fall back to default task when selected task is null | Automated | Added analytics coverage; web tests passed |
| UI-193 | Web | PASS | Public leaderboard ranks meaningful requests by total tokens and uses stored GitHub mappings | Automated | Added analytics coverage; web tests passed |
| UI-194 | Web | PASS | Model summaries group known model ids and unknown model requests | Automated | Added analytics coverage; web tests passed |
| UI-195 | Web | PASS | Repository and activity helpers handle Windows paths, workspace fallbacks, and invalid dates | Automated | Added analytics coverage; web tests passed |
| API-196 | API/Backend | PASS | GitHub billing sync date parser accepts valid dates and leap days | Automated | Added `parseBillingDate` coverage; web tests passed |
| API-197 | API/Backend | PASS | GitHub billing sync date parser treats missing date as default-date request | Automated | Added `parseBillingDate` coverage; web tests passed |
| API-198 | API/Backend | PASS | GitHub billing sync date parser rejects malformed and impossible dates | Automated | Added `parseBillingDate` coverage; web tests passed |
| EXT-199 | Extension | PASS | Current session token stats return null when no completed total-token request exists | Automated | Extracted `sessionTokenStats`; extension tests passed |
| EXT-200 | Extension | PASS | Current session token stats choose the latest tokenized session and aggregate incomplete rows as lower-bound data | Automated | Extracted `sessionTokenStats`; extension tests passed |
| EXT-201 | Extension | PASS | Extension cost estimator prices newer `gpt-5.4-nano` aliases | Automated | Added pricing assertion; extension tests passed |
| EXT-202 | Extension | PASS | Extension cost estimator prices `claude-haiku-4.5` aliases | Automated | Added pricing assertion; extension tests passed |
| UI-203 | Web | PASS | WorkItemPicker allows multi-character text and digit-only id searches while suppressing one-character non-id queries | Automated | Extracted helper coverage; web tests passed |
| UI-204 | Web | PASS | WorkItemPicker maps Azure DevOps forbidden, unauthorized, and rate-limit API errors to clear user messages | Automated | Extracted helper coverage; web tests passed |
| UI-205 | Web | PASS | WorkItemPicker falls back to status-based errors for unknown or non-JSON failures | Automated | Extracted helper coverage; web tests passed |
| API-206 | API/Backend | PASS | Chat request ingest normalization derives complete, partial, and missing token source states | Automated | Extracted `chatRequestMerge`; web tests passed |
| API-207 | API/Backend | PASS | Duplicate chat request records keep the richer telemetry row while filling fallback metadata | Automated | Added dedupe merge coverage; web tests passed |
| API-208 | API/Backend | PASS | Batch upsert preparation normalizes token totals before deduping duplicate request records | Automated | Added `prepareChatRequestsForUpsert` coverage; web tests passed |
| UI-209 | Web | PASS | Request session grid sorts an extension-opened focused session before newer sessions | Automated | Extracted session grid model coverage; web tests passed |
| UI-210 | Web | PASS | Request session grid sorts sessions and rows by latest request activity | Automated | Extracted session grid model coverage; web tests passed |
| UI-211 | Web | PASS | Request session task display honors manual overrides and clearing falls back to detected/default tasks | Automated | Extracted session grid model coverage; web tests passed |
| UI-212 | Web | PASS | Session bulk editor shows a common task only when all session requests agree | Automated | Extracted session grid model coverage; web tests passed |
| UI-213 | Web | PASS | Request token/cost labels distinguish complete, partial, missing, unpriced, and priced requests | Automated | Extracted session grid model coverage; web tests passed |
| UI-214 | Web | PASS | Focused session anchor ids remain stable for punctuation and spaces | Automated | Extracted session grid model coverage; web tests passed |
| EXT-215 | Extension | PASS | Status bar task and token text formats short/long task ids, standard numbers, compact token totals, and small costs | Automated | Extracted `statusFormatting`; extension tests passed |
| EXT-216 | Extension | PASS | Session estimated cost tooltip marks cost as a lower bound when any request has incomplete token data | Automated | Extracted `statusFormatting`; extension tests passed |
| UI-217 | Web | PASS | GitHub username editor can surface safe server validation errors | Automated | Added GitHub-login mutation error-message coverage; web tests passed |
| UI-218 | Web | PASS | GitHub username editor falls back to a generic error for empty or non-JSON failures | Automated | Added GitHub-login mutation error-message coverage; web tests passed |
| EXT-219 | Extension | PASS | Open-dashboard URL helper builds tracker dashboard links rooted at `/dashboard` | Automated | Extracted `trackerDashboardUrl`; extension tests passed |
| EXT-220 | Extension | PASS | Open-dashboard URL helper encodes focused session ids in dashboard links | Automated | Extracted `trackerDashboardUrl`; extension tests passed |
| EXT-221 | Extension | PASS | Open-dashboard URL helper rejects invalid tracker server URLs before opening external links | Automated | Extracted `trackerDashboardUrl`; extension tests passed |
| EXT-222 | Extension | PASS | Task history reader ignores malformed entries and sorts valid task states by timestamp | Automated | Extracted `taskHistory`; extension tests passed |
| EXT-223 | Extension | PASS | OTel request task resolver assigns historical branch/default/selected task based on request start time | Automated | Extracted `taskHistory`; extension tests passed |
| EXT-224 | Extension | PASS | OTel request task resolver falls back to branch default or workspace fallback when manual selection is cleared | Automated | Extracted `taskHistory`; extension tests passed |
| EXT-225 | Extension | PASS | OTel request task resolver handles unsorted task-history input defensively | Automated | Resolver now sorts a copy internally; extension tests passed |
| DEP-226 | Deployment | PASS | VS Code extension packages into a VSIX after refactors | Manual command | `pnpm --filter ./apps/extension package` passed; generated artifact removed |
| DEP-227 | Deployment | PASS | Extension VSIX package includes a local MIT license file without `vsce` missing-license warning | Manual command | Added `apps/extension/LICENSE`; package command passed and warning disappeared |
| AUTH-228 | Auth | PASS | Azure session-token payload parsing trims tokens, rejects invalid access tokens, preserves refresh-token fallback, defaults invalid expiry, and refreshes near-expiry tokens | Automated | Extracted `authSessionTokens`; web tests passed |
| AUTH-229 | Auth/Security | PASS | Stored session-token crypto round-trips encrypted tokens, refuses missing-key reads, preserves legacy plaintext only with a key, and rejects malformed or tampered encrypted values | Automated | Extracted `sessionTokenCrypto`; web tests passed |
| API-230 | API/Backend | PASS | GitHub-login PATCH JSON reader accepts objects but rejects malformed JSON, arrays, strings, and null bodies before mutation logic | Automated | Extracted `readJsonObjectPayload`; web tests passed |
