import {
  CopilotChatRequest,
  TokenSource,
  TrackerEvent,
  TrackerEventType,
} from "@copilot-tracker/shared";
import { eq, sql } from "drizzle-orm";

import { db } from "./db";
import {
  chatRequests,
  githubCopilotBillingUsage,
  sessions,
  trackerEvents,
  users,
} from "./db/schema";

export interface StoredUser {
  githubId: number;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
  role: "admin" | "user";
  createdAt: string;
  lastSeenAt: string;
}

export interface StoredSession {
  id: string;
  githubId: number;
  createdAt: string;
  expiresAt: string;
}

export type StoredTrackerEvent = TrackerEvent & {
  githubLogin: string | null;
  githubId: number | null;
};

export type StoredChatRequest = CopilotChatRequest & {
  githubLogin: string | null;
  githubId: number | null;
};

export interface TrackerDatabase {
  users: StoredUser[];
  sessions: StoredSession[];
  events: StoredTrackerEvent[];
  chatRequests: StoredChatRequest[];
  githubCopilotBillingUsage: StoredGithubCopilotBillingUsage[];
}

export interface StoredGithubCopilotBillingUsage {
  id: string;
  scopeType: "user" | "organization" | "enterprise";
  scope: string;
  date: string;
  product: string | null;
  sku: string | null;
  quantity: string | null;
  unitType: string | null;
  grossAmount: string | null;
  discountAmount: string | null;
  netAmount: string | null;
  raw: Record<string, unknown>;
  fetchedAt: string;
}

export async function readDatabase(): Promise<TrackerDatabase> {
  const [
    storedUsers,
    storedSessions,
    storedEvents,
    storedChatRequests,
    storedGithubCopilotBillingUsage,
  ] = await Promise.all([
    db.select().from(users),
    db.select().from(sessions),
    db.select().from(trackerEvents),
    db.select().from(chatRequests),
    db.select().from(githubCopilotBillingUsage),
  ]);

  return {
    users: storedUsers,
    sessions: storedSessions,
    events: storedEvents.map(toStoredEvent),
    chatRequests: storedChatRequests.map(toStoredChatRequest),
    githubCopilotBillingUsage: storedGithubCopilotBillingUsage,
  };
}

export async function upsertUser(
  user: Omit<StoredUser, "createdAt" | "lastSeenAt">,
): Promise<StoredUser> {
  const now = new Date().toISOString();
  const [stored] = await db
    .insert(users)
    .values({ ...user, createdAt: now, lastSeenAt: now })
    .onConflictDoUpdate({
      target: users.githubId,
      set: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatarUrl,
        email: user.email,
        role: user.role,
        lastSeenAt: now,
      },
    })
    .returning();

  return stored;
}

export async function createSession(githubId: number): Promise<StoredSession> {
  const [session] = await db
    .insert(sessions)
    .values({
      id: crypto.randomUUID(),
      githubId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .returning();

  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function insertTrackerEvent(
  event: TrackerEvent,
  user: StoredUser,
): Promise<void> {
  await db
    .insert(trackerEvents)
    .values({
      ...event,
      payload: event.payload ?? null,
      githubLogin: user.login,
      githubId: user.githubId,
    })
    .onConflictDoNothing({ target: trackerEvents.eventId });
}

export async function upsertChatRequests(
  requests: CopilotChatRequest[],
  user: StoredUser,
): Promise<void> {
  if (requests.length === 0) {
    return;
  }

  await db
    .insert(chatRequests)
    .values(
      requests.map((request) => ({
        ...request,
        promptTokenDetails: request.promptTokenDetails ?? [],
        stopReasons: request.stopReasons ?? [],
        githubLogin: user.login,
        githubId: user.githubId,
      })),
    )
    .onConflictDoUpdate({
      target: chatRequests.requestRecordId,
      set: {
        requestId: sql`excluded.request_id`,
        responseId: sql`excluded.response_id`,
        sessionId: sql`excluded.session_id`,
        sessionTitle: sql`excluded.session_title`,
        sessionCreatedAt: sql`excluded.session_created_at`,
        requestStartedAt: sql`excluded.request_started_at`,
        requestCompletedAt: sql`excluded.request_completed_at`,
        modelId: sql`excluded.model_id`,
        resolvedModel: sql`excluded.resolved_model`,
        modelName: sql`excluded.model_name`,
        modelVendor: sql`excluded.model_vendor`,
        modelFamily: sql`excluded.model_family`,
        inputTokens: sql`excluded.input_tokens`,
        outputTokens: sql`excluded.output_tokens`,
        totalTokens: sql`excluded.total_tokens`,
        tokenSource: sql`excluded.token_source`,
        promptTokenDetails: sql`excluded.prompt_token_details`,
        toolCallRoundCount: sql`excluded.tool_call_round_count`,
        stopReasons: sql`excluded.stop_reasons`,
        capturedAt: sql`excluded.captured_at`,
        workspaceId: sql`excluded.workspace_id`,
        workspacePath: sql`excluded.workspace_path`,
        workspaceName: sql`excluded.workspace_name`,
        repositoryRoot: sql`excluded.repository_root`,
        repositoryRemoteUrl: sql`excluded.repository_remote_url`,
        branch: sql`excluded.branch`,
        defaultTask: sql`excluded.default_task`,
        selectedTask: sql`excluded.selected_task`,
        githubLogin: user.login,
        githubId: user.githubId,
      },
    });
}

export async function updateChatRequestTask(
  requestRecordId: string,
  selectedTask: string,
  user: StoredUser,
  canEditAll: boolean,
): Promise<boolean> {
  const [chatRequest] = await db
    .select({ githubId: chatRequests.githubId })
    .from(chatRequests)
    .where(eq(chatRequests.requestRecordId, requestRecordId))
    .limit(1);

  if (!chatRequest || (!canEditAll && chatRequest.githubId !== user.githubId)) {
    return false;
  }

  await db
    .update(chatRequests)
    .set({ selectedTask })
    .where(eq(chatRequests.requestRecordId, requestRecordId));

  return true;
}

export async function upsertGithubCopilotBillingUsage(
  rows: StoredGithubCopilotBillingUsage[],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  await db
    .insert(githubCopilotBillingUsage)
    .values(rows)
    .onConflictDoUpdate({
      target: githubCopilotBillingUsage.id,
      set: {
        product: sql`excluded.product`,
        sku: sql`excluded.sku`,
        quantity: sql`excluded.quantity`,
        unitType: sql`excluded.unit_type`,
        grossAmount: sql`excluded.gross_amount`,
        discountAmount: sql`excluded.discount_amount`,
        netAmount: sql`excluded.net_amount`,
        raw: sql`excluded.raw`,
        fetchedAt: sql`excluded.fetched_at`,
      },
    });
}

function toStoredEvent(
  row: typeof trackerEvents.$inferSelect,
): StoredTrackerEvent {
  return {
    eventId: row.eventId,
    eventType: row.eventType as TrackerEventType,
    timestamp: row.timestamp,
    user: row.user,
    vscodeVersion: row.vscodeVersion,
    extensionVersion: row.extensionVersion,
    workspaceId: row.workspaceId,
    workspacePath: row.workspacePath,
    workspaceName: row.workspaceName,
    repositoryRoot: row.repositoryRoot,
    repositoryRemoteUrl: row.repositoryRemoteUrl,
    branch: row.branch,
    defaultTask: row.defaultTask,
    selectedTask: row.selectedTask,
    payload: row.payload ?? undefined,
    githubLogin: row.githubLogin,
    githubId: row.githubId,
  };
}

function toStoredChatRequest(
  row: typeof chatRequests.$inferSelect,
): StoredChatRequest {
  return {
    requestRecordId: row.requestRecordId,
    requestId: row.requestId,
    responseId: row.responseId,
    sessionId: row.sessionId,
    sessionTitle: row.sessionTitle,
    sessionCreatedAt: row.sessionCreatedAt,
    requestStartedAt: row.requestStartedAt,
    requestCompletedAt: row.requestCompletedAt,
    modelId: row.modelId,
    resolvedModel: row.resolvedModel,
    modelName: row.modelName,
    modelVendor: row.modelVendor,
    modelFamily: row.modelFamily,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    totalTokens: row.totalTokens,
    tokenSource: row.tokenSource as TokenSource,
    promptTokenDetails: row.promptTokenDetails,
    toolCallRoundCount: row.toolCallRoundCount,
    stopReasons: row.stopReasons,
    capturedAt: row.capturedAt,
    workspaceId: row.workspaceId,
    workspacePath: row.workspacePath,
    workspaceName: row.workspaceName,
    repositoryRoot: row.repositoryRoot,
    repositoryRemoteUrl: row.repositoryRemoteUrl,
    branch: row.branch,
    defaultTask: row.defaultTask,
    selectedTask: row.selectedTask,
    githubLogin: row.githubLogin,
    githubId: row.githubId,
  };
}
