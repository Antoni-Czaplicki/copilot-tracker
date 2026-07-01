import { z } from "zod";

const nullableString = z.string().max(2048).nullable();
const shortNullableString = z.string().max(512).nullable();
const timestampNullableString = z.string().max(64).nullable();
const maxPostgresInteger = 2_147_483_647;
const nonNegativeInteger = z
  .number()
  .int()
  .nonnegative()
  .max(maxPostgresInteger)
  .nullable();
const selectedTaskSchema = z
  .string()
  .trim()
  .min(1)
  .max(256)
  .nullable();

const workspaceContextSchema = {
  workspaceId: z.string().trim().min(1).max(256),
  workspacePath: nullableString,
  workspaceName: shortNullableString,
  repositoryRoot: nullableString,
  repositoryRemoteUrl: nullableString,
  branch: shortNullableString,
  defaultTask: shortNullableString,
  selectedTask: shortNullableString,
};

export const promptTokenDetailSchema = z.object({
  category: shortNullableString,
  label: shortNullableString,
  percentageOfPrompt: z.number().min(0).max(100).nullable(),
});

export const copilotChatRequestSchema = z.object({
  ...workspaceContextSchema,
  requestRecordId: z.string().trim().min(1).max(512),
  requestId: shortNullableString,
  responseId: shortNullableString,
  sessionId: z.string().trim().min(1).max(512),
  sessionTitle: nullableString,
  sessionCreatedAt: timestampNullableString,
  requestStartedAt: timestampNullableString,
  requestCompletedAt: timestampNullableString,
  modelId: shortNullableString,
  resolvedModel: shortNullableString,
  modelName: shortNullableString,
  modelVendor: shortNullableString,
  modelFamily: shortNullableString,
  inputTokens: nonNegativeInteger,
  outputTokens: nonNegativeInteger,
  totalTokens: nonNegativeInteger,
  tokenSource: z.enum([
    "copilot-otel",
    "partial-in-copilot-otel",
    "missing-in-copilot-otel",
  ]),
  promptTokenDetails: z.array(promptTokenDetailSchema).max(100).default([]),
  toolCallRoundCount: z.number().int().nonnegative().max(1000),
  stopReasons: z.array(z.string().max(256)).max(50).default([]),
  capturedAt: z.string().max(64),
});

export const chatRequestBatchSchema = z.object({
  requests: z.array(copilotChatRequestSchema).max(500),
});

export const trackerEventSchema = z.object({
  ...workspaceContextSchema,
  eventId: z.string().trim().min(1).max(512),
  eventType: z.enum([
    "extension-started",
    "task-changed",
    "branch-changed",
    "session-sync-started",
    "session-sync-finished",
    "session-sync-failed",
  ]),
  timestamp: z.string().max(64),
  user: z.string().max(256),
  vscodeVersion: z.string().max(64),
  extensionVersion: z.string().max(64),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const taskAssignmentSchema = z.object({
  requestRecordIds: z.array(z.string().trim().min(1).max(512)).max(500).optional(),
  selectedTask: selectedTaskSchema,
  sessionId: z.string().trim().min(1).max(512).optional(),
});
