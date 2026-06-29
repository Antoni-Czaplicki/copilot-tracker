import { index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  userId: text("user_id").primaryKey(),
  login: text("login").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  githubLogin: text("github_login"),
  role: text("role", { enum: ["admin", "user"] })
    .notNull()
    .default("user"),
  createdAt: text("created_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const trackerEvents = pgTable(
  "tracker_events",
  {
    eventId: text("event_id").primaryKey(),
    eventType: text("event_type").notNull(),
    timestamp: text("timestamp").notNull(),
    user: text("user").notNull(),
    vscodeVersion: text("vscode_version").notNull(),
    extensionVersion: text("extension_version").notNull(),
    workspaceId: text("workspace_id").notNull(),
    workspacePath: text("workspace_path"),
    workspaceName: text("workspace_name"),
    repositoryRoot: text("repository_root"),
    repositoryRemoteUrl: text("repository_remote_url"),
    branch: text("branch"),
    defaultTask: text("default_task"),
    selectedTask: text("selected_task"),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    userLogin: text("user_login"),
    githubLogin: text("github_login"),
    userId: text("user_id").references(
      () => users.userId,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    index("tracker_events_user_id_idx").on(table.userId),
    index("tracker_events_workspace_id_idx").on(table.workspaceId),
    index("tracker_events_timestamp_idx").on(table.timestamp),
  ],
);

export const chatRequests = pgTable(
  "chat_requests",
  {
    requestRecordId: text("request_record_id").primaryKey(),
    requestId: text("request_id"),
    responseId: text("response_id"),
    sessionId: text("session_id").notNull(),
    sessionTitle: text("session_title"),
    sessionCreatedAt: text("session_created_at"),
    requestStartedAt: text("request_started_at"),
    requestCompletedAt: text("request_completed_at"),
    modelId: text("model_id"),
    resolvedModel: text("resolved_model"),
    modelName: text("model_name"),
    modelVendor: text("model_vendor"),
    modelFamily: text("model_family"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    totalTokens: integer("total_tokens"),
    tokenSource: text("token_source").notNull(),
    promptTokenDetails: jsonb("prompt_token_details")
      .$type<
        {
          category: string | null;
          label: string | null;
          percentageOfPrompt: number | null;
        }[]
      >()
      .notNull()
      .default([]),
    toolCallRoundCount: integer("tool_call_round_count").notNull().default(0),
    stopReasons: jsonb("stop_reasons").$type<string[]>().notNull().default([]),
    capturedAt: text("captured_at").notNull(),
    workspaceId: text("workspace_id").notNull(),
    workspacePath: text("workspace_path"),
    workspaceName: text("workspace_name"),
    repositoryRoot: text("repository_root"),
    repositoryRemoteUrl: text("repository_remote_url"),
    branch: text("branch"),
    defaultTask: text("default_task"),
    selectedTask: text("selected_task"),
    userLogin: text("user_login"),
    githubLogin: text("github_login"),
    userId: text("user_id").references(
      () => users.userId,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    index("chat_requests_user_id_idx").on(table.userId),
    index("chat_requests_workspace_id_idx").on(table.workspaceId),
    index("chat_requests_selected_task_idx").on(table.selectedTask),
    index("chat_requests_captured_at_idx").on(table.capturedAt),
  ],
);

export const githubCopilotBillingUsage = pgTable(
  "github_copilot_billing_usage",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type", {
      enum: ["user", "organization", "enterprise"],
    }).notNull(),
    scope: text("scope").notNull(),
    date: text("date").notNull(),
    product: text("product"),
    sku: text("sku"),
    quantity: text("quantity"),
    unitType: text("unit_type"),
    grossAmount: text("gross_amount"),
    discountAmount: text("discount_amount"),
    netAmount: text("net_amount"),
    raw: jsonb("raw").$type<Record<string, unknown>>().notNull(),
    fetchedAt: text("fetched_at").notNull(),
  },
  (table) => [
    index("github_copilot_billing_usage_scope_idx").on(
      table.scopeType,
      table.scope,
    ),
    index("github_copilot_billing_usage_date_idx").on(table.date),
  ],
);
