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
| API-231 | API/Backend | PASS | Azure DevOps work-items client status mapping preserves 401/403/429 and maps other upstream failures to 502 | Automated | Extracted `azureDevOpsWorkItemsClientStatus`; web tests passed |
| API-232 | API/Backend | PASS | GitHub billing sync cron auth fails closed without a secret, accepts canonical bearer tokens, and rejects missing, malformed, wrong, or extra-part auth headers | Automated | Extracted `isCronAuthorized`; web tests passed |
| AUTH-233 | Auth | PASS | Azure auth failure hints cover invalid grant, token exchange failure, provider error, and callback failure without exposing provider details | Automated | Expanded `authFailureHint` coverage; web tests passed |
| DEP-234 | Deployment | PASS | Health responses use ready/unhealthy status codes and `Cache-Control: no-store` for freshness probes | Automated | Added `healthResponseInit` coverage; web tests passed |
| DEP-235 | Deployment | PASS | Env examples and deployment contract document non-secret build metadata variables and health no-store smoke expectations | Docs review + validation | Updated `.env.example` and `docs/deployment.md`; typecheck/lint/tests/build passed |
| UI-236 | Web | PASS | Shared response-error reader trims safe server error strings before displaying them | Automated | Added `responseErrors` coverage; web tests passed |
| UI-237 | Web | PASS | Shared response-error reader ignores empty, non-string, array, malformed, and empty responses and uses caller fallbacks | Automated | Added `responseErrors` coverage; web tests passed |
| UI-238 | Web | PASS | Task editing, session mutations, billing sync, GitHub mapping, and WorkItemPicker reuse the shared safe error parser | Code review + automated | Rewired helpers; web/root tests passed |
| EXT-239 | Extension | PASS | TrackerClient work-item search ignores malformed successful payload entries and returns only well-shaped work items | Automated | Added VS Code extension regression test; extension/root tests passed |
| EXT-240 | Extension | PASS | TrackerClient blank JSON error messages fall back to the HTTP status message | Automated | Added VS Code extension regression test; extension/root tests passed |
| API-241 | API/Backend | PASS | GitHub billing response normalizer maps valid usage items into stable database rows | Automated | Added `githubBillingRows` coverage; web/root tests passed |
| API-242 | API/Backend | PASS | GitHub billing response normalizer ignores malformed usage rows and falls back for invalid response dates | Automated | Added malformed response coverage; web/root tests passed |
| API-243 | API/Backend | PASS | GitHub billing response normalizer rejects impossible calendar dates and falls back to the requested sync date | Automated | Added February 31 coverage; web/root tests passed |
| UI-244 | Web/Chrome | PASS | Production homepage loads in the user's Chrome profile with expected title and visible Azure DevOps login links | Real Chrome | Verified `Copilot Tracker` title and visible `/api/auth/azure-devops` anchors |
| AUTH-245 | Auth/Chrome | PASS | Production Azure auth start navigated through the real browser profile and returns stable `auth_code=invalid_client` while external app config is blocked | Real Chrome | Verified returned URL `/?auth=failed&auth_code=invalid_client` |
| AUTH-246 | Auth/Chrome | PASS | Production auth failure page shows safe generic invalid-client guidance without provider description leakage | Real Chrome | Verified no `AADSTS`, `error_description`, or client-secret values in rendered text |
| API-247 | API/Backend | PASS | Shared JSON payload reader returns parsed arrays and scalar JSON values for downstream schema validation | Automated | Added `readJsonPayload` coverage; web/root tests passed |
| API-248 | API/Backend | PASS | Event and chat request mutation routes share the tested malformed JSON fallback helper | Code review + automated | Reused `readJsonPayload`; web/root tests passed |
| UI-249 | Web | PASS | Auth failure and misconfigured notices render as assertive alert regions with stronger error-code emphasis | Code review + build | Added alert semantics/destructive styling; typecheck/lint/tests/build passed |
| DEP-250 | Dependency/Security | PASS | Production dependency audit has no known moderate-or-higher vulnerabilities | Manual command | `pnpm audit --prod --audit-level moderate` passed after moving overrides to `pnpm-workspace.yaml` |
| DEP-251 | Dependency/Security | PASS | Next and shadcn resolve to patched `postcss@8.5.15` with no vulnerable nested PostCSS copy | Manual command | `pnpm why postcss --prod` reports a single `postcss@8.5.15` version |
| DEP-252 | Deployment | PASS | Extension VSIX packaging still succeeds after dependency override/lockfile changes | Manual command | `pnpm --filter ./apps/extension package` passed; generated artifact removed |
| DEP-253 | CI/Release | PASS | Latest pushed commit `a12045b` completed both CI and extension artifact workflows | GitHub Actions | `gh run list` showed success for CI and Build extension workflows |
| UI-254 | Web | PASS | Successful mutation count reader accepts finite numeric fields from JSON responses | Automated | Added `readNumericResponseField` coverage; web/root tests passed |
| UI-255 | Web | PASS | Successful mutation count reader falls back for missing, non-numeric, non-finite, malformed, empty, array, and null payloads | Automated | Added `readNumericResponseField` fallback coverage; web/root tests passed |
| UI-256 | Web | PASS | Admin billing sync and request-session mutation success paths share tolerant count parsing | Code review + automated | Reused `readNumericResponseField`; web/root tests passed |
| UI-257 | Web | PASS | WorkItemPicker successful search payload normalizer maps valid Azure DevOps work items | Automated | Added `workItemsFromSearchPayload` mapping coverage; web/root tests passed |
| UI-258 | Web | PASS | WorkItemPicker successful search payload normalizer filters malformed entries and falls back for null/non-array payloads | Automated | Added malformed payload coverage; web/root tests passed |
| UI-259 | Web | PASS | WorkItemPicker renders only normalized work-item search results from successful responses | Code review + automated | Replaced raw JSON cast with `workItemsFromSearchPayload`; web/root tests passed |
| API-260 | API/Backend | PASS | Azure DevOps WIQL successful response malformed JSON maps to typed bad-response 502 | Automated | Added `azure_devops_bad_response` regression coverage; web/root tests passed |
| API-261 | API/Backend | PASS | Azure DevOps work-item batch successful response malformed JSON maps to typed bad-response 502 | Automated | Added malformed batch response coverage; web/root tests passed |
| API-262 | API/Backend | PASS | Azure DevOps work-item search ignores invalid upstream work-item ids before batch fetching | Automated | Expanded matching-id test with string, negative, and too-large ids; web/root tests passed |
| API-263 | API/Backend | PASS | Azure DevOps work-item search tolerates missing successful upstream result arrays as empty results | Automated | Added missing-array fallback coverage; web/root tests passed |
| API-264 | API/Security | PASS | GitHub billing sync cron bearer authorization is allowed even without admin fallback | Automated | Added `canRunBillingSync` coverage; web/root tests passed |
| API-265 | API/Security | PASS | GitHub billing sync admin fallback is allowed only when the route explicitly enables admin access | Automated | Added `allowAdmin` coverage for POST-vs-GET behavior; web/root tests passed |
| API-266 | API/Security | PASS | GitHub billing sync rejects unauthenticated requests without cron or admin authorization | Automated | Added `canRunBillingSync` rejection coverage; web/root tests passed |
| DOC-267 | Docs | PASS | README distinguishes cron GET billing sync from admin POST billing sync | Docs review + validation | Updated API list and billing sync instructions; typecheck/lint/tests/build passed |
| EXT-268 | Extension | PASS | TrackerClient work-item search filters non-positive and too-large Azure DevOps IDs from successful payloads | Automated | Expanded malformed payload regression; extension/root tests passed |
| UI-269 | Web/Chrome | PASS | Production homepage loads in Chrome with expected title and visible Azure DevOps login links | Real Chrome | Verified title `Copilot Tracker` and two `/api/auth/azure-devops` login links |
| AUTH-270 | Auth/Chrome | PASS | Production Azure auth route reaches known `auth_code=invalid_client` failure without provider-detail leakage | Real Chrome | Verified final URL and safe visible guidance without `AADSTS`, `error_description`, or `client_secret` |
| UI-271 | Web/Chrome | FAIL | Production auth failure page should expose alert semantics for screen readers | Real Chrome | Chrome DOM showed `role=\"alert\"` count 0; likely stale deployment/freshness mismatch because source includes alert semantics |
| AUTH-272 | Auth/API | PASS | Azure OAuth callback preserves a short provider error code safely in `auth_code` | Automated | Provider `access_denied` now redirects with sanitized `auth_code=access_denied`; web/root tests passed |
| AUTH-273 | Auth/API | PASS | Azure OAuth callback does not reflect provider `error_description` when preserving provider error codes | Automated | Route test asserts `error_description` is absent from redirect params; web/root tests passed |
| AUTH-274 | Auth/API | PASS | Azure OAuth callback sanitizes and truncates unsafe provider error code values | Automated | Added control-character/collapse/truncation route coverage; web/root tests passed |
| AUTH-275 | Auth/API | PASS | Azure OAuth callback falls back to `provider_error` when the provider error code sanitizes to blank | Automated | Added blank unsafe provider-error route coverage; web/root tests passed |
| UI-276 | Web | PASS | WorkItemPicker successful search payload normalizer rejects non-positive and too-large Azure DevOps IDs | Automated | Expanded malformed work-item payload regression; web/root tests passed |
| EXT-277 | Extension | PASS | TrackerClient caps long JSON server error messages before surfacing them in VS Code | Automated | Added extension regression; extension/root tests passed with 26 extension tests |
| DOC-278 | Docs/Deployment | PASS | Deployment smoke docs distinguish preserved sanitized auth codes from forbidden provider descriptions | Docs review | Updated `docs/deployment.md`; `git diff --check` passed |
| DEP-279 | Deployment | PASS | Production smoke verifier checks health, build metadata, cache control, Azure PKCE/scopes, and provider-error callback behavior | Script + live prod | Added `pnpm smoke:production`; strict mode fails current stale production as expected |
| DEP-280 | Deployment | PASS | Production smoke verifier can monitor known stale production without hiding freshness warnings | Script + live prod | `pnpm smoke:production -- --allow-known-stale` passed with warnings for unknown metadata, missing no-store header, and stale auth code |
| DEP-281 | Deployment | PASS | Production smoke verifier passes against a mocked fresh deployment | Automated | Added local HTTP-server smoke verifier test; root tests passed |
| DEP-282 | Deployment | PASS | Production smoke verifier fails strict mode against mocked stale metadata/cache/auth-code behavior | Automated | Added local HTTP-server smoke verifier test; root tests passed |
| DEP-283 | Deployment | PASS | Production smoke verifier known-stale mode reports warnings without failing mocked stale behavior | Automated | Added local HTTP-server smoke verifier test; root tests passed |
| DEP-284 | Deployment | PASS | Health freshness helper emits browser and intermediary no-store/no-cache headers | Automated | Added `healthCacheHeaders` regression coverage; web/root tests passed |
| DEP-285 | Deployment | PASS | Ready and unhealthy health responses share the expanded freshness header contract | Automated | Updated `healthResponseInit` coverage; web/root tests passed |
| DEP-286 | Deployment | PASS | Next production build accepts `/api/health` route header configuration sourced from the shared helper | Build/lint | `pnpm -r lint`, `pnpm -r typecheck`, and placeholder-env `pnpm --filter @copilot-tracker/web build` passed |
| DEP-287 | Deployment | PASS | Production smoke verifier can require an expected deployed SHA | Automated | Added `--expect-sha=abc1234` smoke verifier coverage; `pnpm test:smoke` passed |
| DEP-288 | Deployment | PASS | Production smoke verifier accepts the forwarded `--` separator used by `pnpm smoke:production -- ...` | Automated | Added parser regression coverage; `pnpm test:smoke` passed |
| DEP-289 | Deployment | PASS | Production smoke verifier accepts short and full matching SHA prefixes | Automated | Added `--expect-sha abc` coverage against mocked `abc1234`; `pnpm test:smoke` passed |
| DEP-290 | Deployment | PASS | Production smoke verifier fails strict mode when deployed SHA does not match expected SHA | Automated | Added mocked mismatch failure coverage; `pnpm test:smoke` passed |
| DEP-291 | Deployment | PASS | Production smoke verifier warns instead of failing expected-SHA checks in known-stale mode | Automated + live prod | `pnpm smoke:production -- --allow-known-stale --expect-sha 0bc8f68` passed with metadata/SHA warnings |
| DEP-292 | Deployment | PASS | Production after VPS recovery serves health `Cache-Control: no-store` and provider-error callback `auth_code=access_denied` | Live prod curl + smoke | Strict smoke now fails only on unknown build metadata; cache/provider checks pass |
| UI-293 | Web | PASS | Production auth failure page includes alert semantics and safe invalid-client text | Live prod curl | HTML contains `role="alert"` and `invalid_client`; no `AADSTS`, `error_description`, or `client_secret` matches were returned |
| AUTH-294 | Auth/Chrome | FAIL | Production Azure login should complete with the existing signed-in Chrome profile | Real Chrome | Retrying the visible Azure DevOps login link still returns `/?auth=failed&auth_code=invalid_client` |
| UI-295 | Web/Chrome | PASS | Production OAuth failure page remains safe after real Chrome login retry | Real Chrome | One alert region, two retry links, and no provider-description leakage were observed |
| AUTH-296 | Auth/Diagnostics | PASS | Azure auth failure references are short URL-safe values suitable for browser-to-log correlation | Automated | Added `createAuthFailureReference` coverage; web/root tests passed |
| AUTH-297 | Auth/Diagnostics | PASS | Azure auth diagnostic log events redact secrets and bearer tokens while keeping stage/code/provider details | Automated | Added `authFailureLogEvent` redaction coverage; web/root tests passed |
| AUTH-298 | Auth/API | PASS | Provider-error callbacks redirect with safe `auth_ref` and log a matching redacted server-side event | Automated | Expanded auth route coverage; web/root tests passed |
| AUTH-299 | Auth/API | PASS | OAuth state/PKCE failures log diagnostic booleans without raw code, state, verifier, or cookies | Automated | Expanded auth route coverage; web/root tests passed |
| UI-300 | Web | PASS | Public auth failure page can display a safe diagnostic reference without provider descriptions | Code review + build | Added `auth_ref` rendering; typecheck/lint/root tests/build passed |
| DEP-301 | Deployment | PASS | Production smoke verifier checks provider-error callback `auth_ref` freshness | Automated + live prod | Local smoke tests passed; live production currently warns `auth_ref` missing until diagnostics deploy |
| AUTH-302 | Auth/Chrome/Dokploy | PASS | Real production Chrome `invalid_client` failure exposes an `auth_ref` that matches a redacted Dokploy log event | Chrome + Dokploy UI | Observed `auth_ref` in public URL/page and matching `azure_oauth_callback_failed` log event in Dokploy without provider details in the browser |
| AUTH-303 | Auth/Diagnosis | FAIL | Production Azure OAuth client configuration should allow token exchange | Dokploy logs | Matching log reports Azure `AADSTS700025`: client is public, so client secret should not be presented; fix Azure app registration/client type or auth config |
| DOC-304 | Docs/Deployment | PASS | Deployment docs explain explicit Dokploy build metadata fields and Azure confidential-client requirements | Docs review | Clarified Build Time Arguments/runtime env and web/confidential-client setup for current backend OAuth flow |
| AUTH-305 | Auth/Azure Portal | FAIL | Production callback redirect should be configured under a Web/confidential platform for the current backend flow | Chrome Azure portal | Entra Authentication view shows the callback platform as `Single-page application`; this matches `AADSTS700025` because the backend sends a client secret |
| AUTH-306 | Auth/Azure Portal | BLOCKED | Current signed-in Chrome account should be able to edit the app registration to fix platform type | Chrome Azure portal | Account can inspect the registration, but redirect/platform edit controls are disabled and the account is not listed as an owner |
| AUTH-307 | Auth/Chrome | PASS | Production Azure login no longer fails with `invalid_client` after the Web redirect fix | Real Chrome | Login now reaches `auth_code=profile_or_org_check_failed`, proving the previous public-client/confidential-client token-exchange mismatch is cleared |
| AUTH-308 | Auth/Chrome | FAIL | Production Azure login should complete profile/org validation and create a dashboard session | Real Chrome | Login currently returns `auth_code=profile_or_org_check_failed` with a safe `auth_ref` |
| AUTH-309 | Auth/Diagnostics | PASS | Profile/org auth failures include redacted server-side result/status diagnostics | Automated | Added diagnostics coverage for profile request failures, org membership misses, and callback log fields; web tests passed |
| AUTH-310 | Auth/Dokploy | PASS | Deployed profile/org diagnostics appear in Dokploy logs for a real Chrome auth failure | Chrome + Dokploy UI | Matching log includes profile lookup OK/status 200 and org membership not matched/status 200 without tokens, profile payloads, org names, or secrets |
| AUTH-311 | Auth/Diagnosis | FAIL | Signed-in Azure profile should match the configured Azure DevOps organization | Chrome + Dokploy UI | Deployed diagnostics show one account returned but no configured-org match; fix `AZURE_DEVOPS_ORG` or the user's Azure DevOps org membership/visibility |
| AUTH-312 | Auth/Chrome/Dokploy | FAIL | Production login should pass profile/org validation after Azure Web redirect fix | Real Chrome + Dokploy UI | Fresh retry still returns `profile_or_org_check_failed`; matching log says profile OK and org membership not matched with one account returned |
| AUTH-313 | Auth/Config | PASS | `AZURE_DEVOPS_ORG` accepts plain organization slugs with whitespace/trailing slash normalization | Automated | Added `normalizeAzureDevOpsOrg` config coverage; web tests passed |
| AUTH-314 | Auth/Config | PASS | `AZURE_DEVOPS_ORG` accepts `https://dev.azure.com/<org>` and extracts the organization slug | Automated | Added `normalizeAzureDevOpsOrg` config coverage; web tests passed |
| AUTH-315 | Auth/Config | PASS | `AZURE_DEVOPS_ORG` accepts old-style `https://<org>.visualstudio.com` URLs and extracts the organization slug | Automated | Added `normalizeAzureDevOpsOrg` config coverage; web tests passed |
| DOC-316 | Docs/Deployment | PASS | README and deployment docs explain supported `AZURE_DEVOPS_ORG` formats | Docs review + validation | Documented slug, `dev.azure.com`, and `visualstudio.com` formats; typecheck/lint/tests/build passed |
| AUTH-317 | Auth/Chrome/Dokploy | FAIL | Production login should succeed after org URL normalization deploy | Real Chrome + Dokploy UI | `9a3acb1` deployed and login still returned `profile_or_org_check_failed`; matching log still says profile OK and org membership not matched |
| AUTH-318 | Auth/Backend | PASS | Account-list org mismatch should fail closed when direct configured-org probe is forbidden | Automated | Callback route and user lookup tests assert `orgAccessProbeResult=request_failed`, HTTP 403, and no user/session |
| AUTH-319 | Auth/Backend | PASS | Account-list org mismatch should be accepted when the same token can query the configured org WIQL endpoint | Automated | Added user lookup test accepting `matched_by_configured_org_probe` only on valid WIQL JSON |
| AUTH-320 | Auth/Diagnostics | PASS | Profile/org failure logs include direct configured-org probe result/status without secrets | Automated + docs | Added redacted `orgAccessProbeResult`/`orgAccessProbeStatus` fields and documented them |
| AUTH-321 | Auth/Dokploy | PASS | Deployed direct configured-org probe logs the configured-org access failure status | Chrome + Dokploy UI | After `01650a4` deploy, matching auth log includes `orgAccessProbeResult=request_failed` and `orgAccessProbeStatus=401` |
| AUTH-322 | Auth/Diagnosis | FAIL | Signed-in user/token should be able to query the configured Azure DevOps org WIQL endpoint | Chrome + Dokploy UI | Profile lookup succeeds and accounts API returns one account, but configured-org WIQL probe returns 401; fix org config/user access/consent |
| DEP-323 | Deployment | PASS | Production runtime Azure DevOps org config can be corrected without exposing the org value in repo logs | Dokploy UI/API + smoke | Runtime org was updated to the user-provided accessible value, redeployed, and production smoke passed hard gates |
| DEP-324 | Deployment | PASS | Production runtime has a dedicated session-token encryption key for Azure DevOps token persistence | Dokploy UI/API + Chrome | Runtime `COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY` is present; value was not recorded; fresh signed-in session can call work-item API |
| AUTH-325 | Auth/Chrome | PASS | Production Azure login completes after runtime org correction | Real Chrome | Fresh logout/login from the visible `Log in with Azure DevOps` link lands on `/dashboard` |
| AUTH-326 | Auth/Web API | PASS | Signed-in production work-item search route uses the fresh web session Azure token | Real Chrome + page API probe | `/api/azure-devops/work-items?query=test` returns HTTP 200 with valid JSON and zero matches for that literal query |
| DEP-327 | Deployment | PASS/WARN | Production smoke passes hard gates after auth runtime env redeploy | Live prod smoke | `pnpm smoke:production -- --allow-known-stale --expect-sha 1506101` passes; warnings remain only for unknown build metadata/SHA |
| ADMIN-328 | Admin/Deployment | PASS | Production admin login list can be updated without exposing the list in repo logs | Dokploy UI/API | Requested login was added to `ADMIN_AZURE_DEVOPS_LOGINS`; one canonical admin env line remains; list values not recorded |
| ADMIN-329 | Admin/Chrome | PASS | Fresh production login for the requested admin shows Admin navigation | Real Chrome | Logout/login after redeploy lands on `/dashboard` with Admin nav visible |
| ADMIN-330 | Admin/Chrome | PASS | Production `/admin` is accessible for the requested admin | Real Chrome | Direct `/admin` load renders admin content and export links without unauthorized state |
| DEP-331 | Deployment | PASS/WARN | Production smoke passes hard gates after admin runtime env redeploy | Live prod smoke | `pnpm smoke:production -- --allow-known-stale --expect-sha 0f9b2b8` passes; warnings remain only for unknown build metadata/SHA |
| EXT-332 | Extension/VS Code | FAIL | Real VS Code sign-in should acquire usable auth for production sync | Real VS Code + Chrome | Old direct VS Code Microsoft auth failed with Microsoft `AADSTS65002`; fixed by replacing flow with tracker-session browser callback |
| EXT-333 | Extension/Auth | PASS | Extension sign-in URL includes tracker extension-token route, VS Code callback, and opaque state | Automated | Added `extensionSignInUrl` coverage; extension tests pass |
| EXT-334 | Extension/Auth | PASS | Extension stores callback token only when returned state matches the locally stored state | Automated | Added `TrackerClient.completeSignIn` state-match coverage; extension tests pass |
| EXT-335 | Extension/Auth | PASS | Extension rejects callback token when state is missing or mismatched | Automated | Added invalid callback regression; extension tests pass |
| API-336 | API/Auth | PASS | Extension callback route rejects unsafe callback URLs before session lookup | Automated | Added route test returning HTTP 400 for non-VS Code callback |
| API-337 | API/Auth | PASS | Extension callback URL parser accepts only this extension's VS Code/Insiders auth callback | Automated | Added `parseExtensionCallbackUrl` allow/reject coverage |
| API-338 | API/Auth | PASS | Extension callback state accepts only compact URL-safe values | Automated | Added `parseExtensionAuthState` coverage |
| API-339 | API/Auth | PASS | Ingest endpoints accept tracker session bearer tokens before legacy Azure bearer fallback | Code review + typecheck | `authenticateIngestRequest` now checks `readUserBySessionId` first; web typecheck/lint/tests pass |
| API-340 | API/Auth | PASS | Work-item route uses server-stored Azure token when bearer is a tracker session | Code review + typecheck | Route checks tracker session bearer and calls `readAzureDevOpsSessionAccessToken`; web typecheck/lint/tests pass |
| DEP-341 | Deployment/Build | PASS | Next production build includes `/api/auth/extension-token` route | Build | Placeholder-env `pnpm --filter @copilot-tracker/web build` passed and listed the route |
| EXT-342 | Extension/Package | PASS | VSIX package excludes deleted direct Azure DevOps auth module | Package inspection | Clean package file list no longer contains `azureDevOpsAuth.js`; VSIX installed into real VS Code |
| DOC-343 | Docs | PASS | README/INSTALL describe tracker-session auth instead of direct VS Code Azure token auth | Docs review + validation | Docs updated; broad typecheck/lint/tests/build passed |
| EXT-344 | Extension/VS Code | PASS | Real VS Code production sign-in completes through tracker web callback and VS Code URI handler | Real VS Code + Chrome | Accepted VS Code external URL/URI prompts; extension showed signed-in success without exposing tokens |
| EXT-345 | Extension/VS Code | PASS | Real OTel fixture sync displays current session token totals and cost in the VS Code status bar | Real VS Code + production API | Status/hover showed 321 input, 123 output, 444 total, `gpt-5-nano`, and `$0.0001` estimated cost |
| EXT-346 | Extension/VS Code | PASS | Extension work-item search uses tracker session auth and handles empty search with manual fallback | Real VS Code + production API | Query returned HTTP 200 and picker showed the manual assignment fallback |
| EXT-347 | Extension/VS Code | PASS | Manual task assignment updates VS Code task status and session title | Real VS Code | Selecting manual `124` changed status item to task `124` and session title to the assigned task |
| UI-348 | Web/Chrome | PASS | Production dashboard reflects the VS Code-ingested session after reload | Real Chrome | Focused session URL preserved; dashboard showed task `124`, one request, `gpt-5-nano`, 321 input, 123 output, 444 total, and `$0.0001` cost |
| EXT-349 | Extension/Reliability | FAIL | OTel lifecycle should not repeatedly rewrite Copilot exporter settings or spam sync events | Real VS Code logs | Real usage found repeated `outfile` rewrites, duplicated lifecycle creation, and redundant event POSTs |
| EXT-350 | Extension/Reliability | PASS | OTel lifecycle rebuilds are coalesced and normal poll/sync reads the active file path without reconfiguring Copilot | Automated + real VS Code | Added single-flight queue coverage; rebuilt VSIX stayed quiet after reload with only normal startup sync and initial file signature capture |
| EXT-351 | Extension/Package | PASS | Rebuilt VSIX includes OTel lifecycle fix and remains installable in real VS Code | Package + real VS Code | VSIX includes `singleFlightTaskQueue.js`; installed with VS Code bundled CLI and reloaded successfully |
| CHECK-352 | Quality | PASS | Broad repo validation passes after real VS Code reliability fix | CLI | `pnpm -r typecheck`, `pnpm -r lint`, placeholder-env web build, extension compile/test, workspace tests, and smoke tests passed |
| CHECK-353 | CI | PASS | Pushed OTel lifecycle fix passes GitHub Actions CI and extension package workflow | GitHub Actions | `CI` and `Build extension` both completed successfully for `ae3d4e4` |
| DEP-354 | Deployment | PASS/WARN | Production smoke stays healthy after the OTel lifecycle commit is pushed | Live prod smoke | `pnpm smoke:production -- --allow-known-stale --expect-sha ae3d4e4` passed hard gates; warnings remain limited to unknown health SHA/build time |
| DEP-355 | Deployment/Build | PASS | Docker build-info generator reads the current branch SHA from minimal `.git` refs | Automated | Added script test with `.git/HEAD` and `.git/refs/heads/main`; `pnpm test:smoke` passed |
| DEP-356 | Deployment/Build | PASS | Docker build-info generator reads packed refs when branch ref files are absent | Automated | Added packed-refs script test; `pnpm test:smoke` passed |
| DEP-357 | Deployment/Build | PASS | Explicit build metadata wins over Git-derived metadata in the build-info generator | Automated | Added script test for explicit SHA plus `SOURCE_DATE_EPOCH`; `pnpm test:smoke` passed |
| DEP-358 | Deployment/API | PASS | Health build metadata falls back to generated build-info when env metadata is missing or unknown | Automated | Added `readBuildInfo` generated-file fallback coverage; web tests passed |
| DEP-359 | Deployment/API | PASS | Explicit runtime build metadata wins over generated build-info file values | Automated | Added `readBuildInfo` precedence coverage; web tests passed |
| DEP-360 | Deployment/Docker | PASS | Dockerfile writes generated build-info and removes `.git` before final image copy | Code review + compose config | Dockerfile runs `write-build-info.mjs`, removes `.git`, and `docker compose config` passed |
| DEP-361 | Deployment/Build | PASS | Production-style web build handles dynamic build-info file lookup without broad Turbopack tracing warnings | Build | Placeholder-env `pnpm --filter @copilot-tracker/web build` passed with no broad-tracing warning |
| DEP-362 | Deployment/Docker | BLOCKED | Full local Docker image build should validate generated metadata inside the image | Docker daemon | `docker version` cannot connect to the local Docker daemon socket |
| CHECK-363 | Quality | PASS | Broad repo validation passes after Docker build metadata fallback | CLI | `pnpm -r typecheck`, `pnpm -r lint`, root `pnpm test`, production-style web build, extension compile/test, compose config, and diff check passed |
| DEP-364 | Deployment/Dokploy | FAIL | Strict production smoke should pass after deploying generated JSON build-info fallback | Dokploy + live prod smoke | Dokploy logs confirmed `apps/web/build-info.json` was written, but `/api/health` still reported unknown SHA/build time after deploy |
| DEP-365 | Deployment/Build | PASS | Docker build-info generator can emit a static TypeScript module before Next build | Automated | Added script test for `apps/web/src/generated/buildInfo.generated.ts` output |
| CHECK-366 | Quality | PASS | Broad local validation passes after switching Docker metadata fallback to generated TypeScript module | CLI | `pnpm test:smoke`, web tests/typecheck/lint, repo typecheck/lint, production-style web build, extension tests, root `pnpm test`, and `git diff --check` passed |
