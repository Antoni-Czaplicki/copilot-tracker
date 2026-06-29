import type {
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
  userId: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
  githubLogin: string | null;
  role: "admin" | "user";
  createdAt: string;
  lastSeenAt: string;
}

export interface StoredSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export type StoredTrackerEvent = TrackerEvent & {
  userLogin: string | null;
  githubLogin: string | null;
  userId: string | null;
};

export type StoredChatRequest = CopilotChatRequest & {
  userLogin: string | null;
  githubLogin: string | null;
  userId: string | null;
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
    events: storedEvents.map((event) => toStoredEvent(event)),
    chatRequests: storedChatRequests.map((request) =>
      toStoredChatRequest(request),
    ),
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
      target: users.userId,
      set: {
        login: user.login,
        name: user.name,
        avatarUrl: user.avatarUrl,
        email: user.email,
        githubLogin: user.githubLogin,
        role: user.role,
        lastSeenAt: now,
      },
    })
    .returning();

  return stored;
}

export async function createSession(userId: string): Promise<StoredSession> {
  const [session] = await db
    .insert(sessions)
    .values({
      id: crypto.randomUUID(),
      userId,
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
      userLogin: user.login,
      githubLogin: user.githubLogin,
      userId: user.userId,
    })
    .onConflictDoNothing({ target: trackerEvents.eventId });
}

export async function upsertChatRequests(
  requests: CopilotChatRequest[],
  user: StoredUser,
): Promise<number> {
  const uniqueRequests = dedupeChatRequests(requests);
  if (uniqueRequests.length === 0) {
    return 0;
  }

  await db
    .insert(chatRequests)
    .values(
      uniqueRequests.map((request) => ({
        ...request,
        promptTokenDetails: request.promptTokenDetails ?? [],
        stopReasons: request.stopReasons ?? [],
        userLogin: user.login,
        githubLogin: user.githubLogin,
        userId: user.userId,
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
        selectedTask: sql`case
          when ${chatRequests.selectedTask} is null
            or ${chatRequests.selectedTask} = ${chatRequests.defaultTask}
          then excluded.selected_task
          else ${chatRequests.selectedTask}
        end`,
        userLogin: user.login,
        githubLogin: user.githubLogin,
        userId: user.userId,
      },
    });

  return uniqueRequests.length;
}

function dedupeChatRequests(
  requests: CopilotChatRequest[],
): CopilotChatRequest[] {
  const uniqueByRecordId = new Map<string, CopilotChatRequest>();
  for (const request of requests) {
    const previous = uniqueByRecordId.get(request.requestRecordId);
    uniqueByRecordId.set(
      request.requestRecordId,
      previous ? chooseRicherChatRequest(previous, request) : request,
    );
  }

  return [...uniqueByRecordId.values()];
}

function chooseRicherChatRequest(
  current: CopilotChatRequest,
  next: CopilotChatRequest,
) {
  if (
    chatRequestCompletenessScore(next) > chatRequestCompletenessScore(current)
  ) {
    return mergeChatRequests(next, current);
  }

  return mergeChatRequests(current, next);
}

function mergeChatRequests(
  preferred: CopilotChatRequest,
  fallback: CopilotChatRequest,
): CopilotChatRequest {
  return {
    ...preferred,
    requestId: preferred.requestId ?? fallback.requestId,
    responseId: preferred.responseId ?? fallback.responseId,
    sessionTitle: preferred.sessionTitle ?? fallback.sessionTitle,
    sessionCreatedAt: preferred.sessionCreatedAt ?? fallback.sessionCreatedAt,
    requestStartedAt: preferred.requestStartedAt ?? fallback.requestStartedAt,
    requestCompletedAt:
      preferred.requestCompletedAt ?? fallback.requestCompletedAt,
    modelId: preferred.modelId ?? fallback.modelId,
    resolvedModel: preferred.resolvedModel ?? fallback.resolvedModel,
    modelName: preferred.modelName ?? fallback.modelName,
    modelVendor: preferred.modelVendor ?? fallback.modelVendor,
    modelFamily: preferred.modelFamily ?? fallback.modelFamily,
    inputTokens: preferred.inputTokens ?? fallback.inputTokens,
    outputTokens: preferred.outputTokens ?? fallback.outputTokens,
    totalTokens: preferred.totalTokens ?? fallback.totalTokens,
    promptTokenDetails:
      preferred.promptTokenDetails.length > 0
        ? preferred.promptTokenDetails
        : fallback.promptTokenDetails,
    stopReasons:
      preferred.stopReasons.length > 0
        ? preferred.stopReasons
        : fallback.stopReasons,
  };
}

function chatRequestCompletenessScore(request: CopilotChatRequest) {
  return [
    request.totalTokens === null ? 0 : 100,
    request.inputTokens === null ? 0 : 20,
    request.outputTokens === null ? 0 : 20,
    request.requestCompletedAt ? 10 : 0,
    request.modelId ? 5 : 0,
    request.promptTokenDetails.length,
    Date.parse(
      request.requestCompletedAt ??
        request.requestStartedAt ??
        request.capturedAt,
    ) / 1_000_000_000_000,
  ].reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export async function updateChatRequestTask(
  requestRecordId: string,
  selectedTask: string,
  user: StoredUser,
  canEditAll: boolean,
): Promise<boolean> {
  const [chatRequest] = await db
    .select({ userId: chatRequests.userId })
    .from(chatRequests)
    .where(eq(chatRequests.requestRecordId, requestRecordId))
    .limit(1);

  if (!chatRequest || (!canEditAll && chatRequest.userId !== user.userId)) {
    return false;
  }

  await db
    .update(chatRequests)
    .set({ selectedTask })
    .where(eq(chatRequests.requestRecordId, requestRecordId));

  return true;
}

export async function updateUserGithubLogin(
  userId: string,
  githubLogin: string | null,
): Promise<StoredUser | null> {
  const [user] = await db
    .update(users)
    .set({
      githubLogin,
      lastSeenAt: new Date().toISOString(),
    })
    .where(eq(users.userId, userId))
    .returning();

  if (!user) {
    return null;
  }

  await db
    .update(chatRequests)
    .set({ githubLogin })
    .where(eq(chatRequests.userId, userId));
  await db
    .update(trackerEvents)
    .set({ githubLogin })
    .where(eq(trackerEvents.userId, userId));

  return user;
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
    userLogin: row.userLogin,
    githubLogin: row.githubLogin,
    userId: row.userId,
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
    userLogin: row.userLogin,
    githubLogin: row.githubLogin,
    userId: row.userId,
  };
}
