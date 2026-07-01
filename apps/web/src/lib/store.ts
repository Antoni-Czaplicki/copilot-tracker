import type {
  CopilotChatRequest,
  TokenSource,
  TrackerEvent,
  TrackerEventType,
} from "@copilot-tracker/shared";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";

import { env } from "@/env";

import { prepareChatRequestsForUpsert } from "./chatRequestMerge";
import { db } from "./db";
import {
  chatRequests,
  githubCopilotBillingUsage,
  sessions,
  trackerEvents,
  users,
} from "./db/schema";

const encryptedTokenPrefix = "v1:";
const maxBulkTaskUpdateSize = 500;

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

export interface AzureDevOpsSessionTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
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
    db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions),
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

export async function readChatRequestsForUser(
  userId: string,
): Promise<StoredChatRequest[]> {
  const storedChatRequests = await db
    .select()
    .from(chatRequests)
    .where(eq(chatRequests.userId, userId));

  return storedChatRequests.map((request) => toStoredChatRequest(request));
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

export async function readUserById(userId: string): Promise<StoredUser | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  return user ?? null;
}

export async function readUserBySessionId(
  sessionId: string,
): Promise<StoredUser | null> {
  const [session] = await db
    .select({
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) {
    return null;
  }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    await deleteSession(sessionId);
    return null;
  }

  return readUserById(session.userId);
}

export async function createSession(
  userId: string,
  azureDevOpsTokens?: AzureDevOpsSessionTokens,
): Promise<StoredSession> {
  const [session] = await db
    .insert(sessions)
    .values({
      id: crypto.randomUUID(),
      userId,
      azureAccessToken: encryptSessionToken(
        azureDevOpsTokens?.accessToken ?? null,
      ),
      azureRefreshToken: encryptSessionToken(
        azureDevOpsTokens?.refreshToken ?? null,
      ),
      azureTokenExpiresAt: azureDevOpsTokens?.expiresAt ?? null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .returning({
      id: sessions.id,
      userId: sessions.userId,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
    });

  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function readSessionAzureDevOpsTokens(
  sessionId: string,
): Promise<AzureDevOpsSessionTokens | null> {
  const [session] = await db
    .select({
      accessToken: sessions.azureAccessToken,
      refreshToken: sessions.azureRefreshToken,
      expiresAt: sessions.azureTokenExpiresAt,
      sessionExpiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) {
    return null;
  }

  if (Date.parse(session.sessionExpiresAt) <= Date.now()) {
    await clearSessionAzureDevOpsTokens(sessionId);
    return null;
  }

  const accessToken = decryptSessionToken(session.accessToken);
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: decryptSessionToken(session.refreshToken),
    expiresAt: session.expiresAt,
  };
}

export async function updateSessionAzureDevOpsTokens(
  sessionId: string,
  tokens: AzureDevOpsSessionTokens,
): Promise<void> {
  await db
    .update(sessions)
    .set({
      azureAccessToken: encryptSessionToken(tokens.accessToken),
      azureRefreshToken: encryptSessionToken(tokens.refreshToken),
      azureTokenExpiresAt: tokens.expiresAt,
    })
    .where(eq(sessions.id, sessionId));
}

export async function clearSessionAzureDevOpsTokens(
  sessionId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({
      azureAccessToken: null,
      azureRefreshToken: null,
      azureTokenExpiresAt: null,
    })
    .where(eq(sessions.id, sessionId));
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
  const uniqueRequests = prepareChatRequestsForUpsert(requests);
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
        requestId: sql`coalesce(excluded.request_id, ${chatRequests.requestId})`,
        responseId: sql`coalesce(excluded.response_id, ${chatRequests.responseId})`,
        sessionId: sql`coalesce(excluded.session_id, ${chatRequests.sessionId})`,
        sessionTitle: sql`coalesce(excluded.session_title, ${chatRequests.sessionTitle})`,
        sessionCreatedAt: sql`coalesce(excluded.session_created_at, ${chatRequests.sessionCreatedAt})`,
        requestStartedAt: sql`coalesce(excluded.request_started_at, ${chatRequests.requestStartedAt})`,
        requestCompletedAt: sql`coalesce(excluded.request_completed_at, ${chatRequests.requestCompletedAt})`,
        modelId: sql`coalesce(excluded.model_id, ${chatRequests.modelId})`,
        resolvedModel: sql`coalesce(excluded.resolved_model, ${chatRequests.resolvedModel})`,
        modelName: sql`coalesce(excluded.model_name, ${chatRequests.modelName})`,
        modelVendor: sql`coalesce(excluded.model_vendor, ${chatRequests.modelVendor})`,
        modelFamily: sql`coalesce(excluded.model_family, ${chatRequests.modelFamily})`,
        inputTokens: sql`coalesce(excluded.input_tokens, ${chatRequests.inputTokens})`,
        outputTokens: sql`coalesce(excluded.output_tokens, ${chatRequests.outputTokens})`,
        totalTokens: sql`coalesce(excluded.total_tokens, ${chatRequests.totalTokens})`,
        tokenSource: sql`case
          when excluded.token_source = 'copilot-otel' then excluded.token_source
          when ${chatRequests.tokenSource} = 'missing-in-copilot-otel' then excluded.token_source
          when ${chatRequests.tokenSource} = 'partial-in-copilot-otel'
            and excluded.token_source <> 'missing-in-copilot-otel'
          then excluded.token_source
          else ${chatRequests.tokenSource}
        end`,
        promptTokenDetails: sql`case
          when jsonb_array_length(excluded.prompt_token_details) > 0
          then excluded.prompt_token_details
          else ${chatRequests.promptTokenDetails}
        end`,
        toolCallRoundCount: sql`greatest(excluded.tool_call_round_count, ${chatRequests.toolCallRoundCount})`,
        stopReasons: sql`case
          when jsonb_array_length(excluded.stop_reasons) > 0
          then excluded.stop_reasons
          else ${chatRequests.stopReasons}
        end`,
        capturedAt: sql`greatest(excluded.captured_at, ${chatRequests.capturedAt})`,
        workspaceId: sql`coalesce(excluded.workspace_id, ${chatRequests.workspaceId})`,
        workspacePath: sql`coalesce(excluded.workspace_path, ${chatRequests.workspacePath})`,
        workspaceName: sql`coalesce(excluded.workspace_name, ${chatRequests.workspaceName})`,
        repositoryRoot: sql`coalesce(excluded.repository_root, ${chatRequests.repositoryRoot})`,
        repositoryRemoteUrl: sql`coalesce(excluded.repository_remote_url, ${chatRequests.repositoryRemoteUrl})`,
        branch: sql`coalesce(excluded.branch, ${chatRequests.branch})`,
        defaultTask: sql`coalesce(excluded.default_task, ${chatRequests.defaultTask})`,
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
      setWhere: sql`${chatRequests.userId} is null or ${chatRequests.userId} = ${user.userId}`,
    });

  return uniqueRequests.length;
}

export async function updateChatRequestTask(
  requestRecordId: string,
  selectedTask: string | null,
  user: StoredUser,
  canEditAll: boolean,
): Promise<boolean> {
  const updatedCount = await updateChatRequestTasks({
    requestRecordIds: [requestRecordId],
    selectedTask,
    user,
    canEditAll,
  });

  return updatedCount > 0;
}

export async function updateChatRequestTasks({
  requestRecordIds,
  sessionId,
  selectedTask,
  user,
  canEditAll,
}: {
  requestRecordIds?: string[];
  sessionId?: string;
  selectedTask: string | null;
  user: StoredUser;
  canEditAll: boolean;
}): Promise<number> {
  const uniqueRequestRecordIds = requestRecordIds
    ? [...new Set(requestRecordIds)].filter(Boolean)
    : [];
  const filters = [];

  if (uniqueRequestRecordIds.length > 0) {
    if (uniqueRequestRecordIds.length > maxBulkTaskUpdateSize) {
      return 0;
    }
    filters.push(inArray(chatRequests.requestRecordId, uniqueRequestRecordIds));
  } else if (sessionId) {
    filters.push(eq(chatRequests.sessionId, sessionId));
  } else {
    return 0;
  }

  if (!canEditAll) {
    filters.push(eq(chatRequests.userId, user.userId));
  }

  const updated = await db
    .update(chatRequests)
    .set({ selectedTask })
    .where(and(...filters))
    .returning({ requestRecordId: chatRequests.requestRecordId });

  return updated.length;
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

function encryptSessionToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const key = sessionTokenEncryptionKey();
  if (!key) {
    return null;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    encryptedTokenPrefix,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptSessionToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith(encryptedTokenPrefix)) {
    return sessionTokenEncryptionKey() ? value : null;
  }

  const key = sessionTokenEncryptionKey();
  if (!key) {
    return null;
  }

  const [, ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

function sessionTokenEncryptionKey() {
  const material = env.COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY;
  if (!material) {
    return null;
  }

  return createHash("sha256").update(material).digest();
}
