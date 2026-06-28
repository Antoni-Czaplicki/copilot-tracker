import * as assert from "assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

import { readCopilotOtelRequests } from "../otel";
import type { WorkspaceContext } from "../types";
import { getTaskFromBranch } from "../workspaceContext";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test("Detects Azure DevOps numeric task ids from branches", () => {
    assert.strictEqual(getTaskFromBranch("124"), "124");
    assert.strictEqual(getTaskFromBranch("124v2"), "124");
    assert.strictEqual(getTaskFromBranch("feature/124-login"), "124");
    assert.strictEqual(getTaskFromBranch("feature/ABC-123-login"), "123");
    assert.strictEqual(getTaskFromBranch("main"), "main");
  });

  test("Reads Copilot OTel invoke_agent request spans", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await mkdir(path.dirname(otelFilePath), { recursive: true });
      await writeFile(
        otelFilePath,
        `${JSON.stringify(
          createResourceSpanRecord([
            {
              traceId: "trace-1",
              spanId: "span-root-1",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782638208197000000",
              endTimeUnixNano: "1782638228982000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-1",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 22066,
                "gen_ai.usage.output_tokens": 1481,
                "github.copilot.git.repository":
                  "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
                "github.copilot.git.branch": "feature/124-login",
                "copilot_chat.turn_count": 1,
              }),
            },
            {
              traceId: "trace-1",
              spanId: "span-chat-1",
              parentSpanId: "span-root-1",
              name: "chat gpt-5-nano",
              startTimeUnixNano: "1782638209000000000",
              endTimeUnixNano: "1782638228000000000",
              attributes: attributes({
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.response.finish_reasons": ["stop"],
                "gen_ai.usage.input_tokens": 22066,
                "gen_ai.usage.output_tokens": 1481,
              }),
            },
          ]),
        )}\n`,
      );

      const workspaceContext = createWorkspaceContext();
      const requests = await readCopilotOtelRequests(
        workspaceContext,
        otelFilePath,
        () => ({
          branch: "feature/124-login",
          defaultTask: "124",
          selectedTask: "124",
        }),
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.requestRecordId, "otel:trace-1");
      assert.strictEqual(requests[0]?.requestId, "trace-1");
      assert.strictEqual(requests[0]?.responseId, "span-root-1");
      assert.strictEqual(requests[0]?.sessionId, "session-1");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "copilot-tracker - 124 - gpt-5-nano",
      );
      assert.strictEqual(requests[0]?.modelId, "openai/OpenAI/gpt-5-nano");
      assert.strictEqual(requests[0]?.resolvedModel, "gpt-5-nano");
      assert.strictEqual(requests[0]?.inputTokens, 22066);
      assert.strictEqual(requests[0]?.outputTokens, 1481);
      assert.strictEqual(requests[0]?.totalTokens, 23547);
      assert.strictEqual(requests[0]?.tokenSource, "copilot-otel");
      assert.strictEqual(requests[0]?.toolCallRoundCount, 1);
      assert.deepStrictEqual(requests[0]?.stopReasons, ["stop"]);
      assert.strictEqual(requests[0]?.branch, "feature/124-login");
      assert.strictEqual(requests[0]?.selectedTask, "124");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Falls back to summing Copilot OTel chat spans", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        `${JSON.stringify(
          createResourceSpanRecord([
            {
              traceId: "trace-2",
              spanId: "span-root-2",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782638300000000000",
              endTimeUnixNano: "1782638310000000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-2",
                "github.copilot.git.repository":
                  "https://github.com/Antoni-Czaplicki/copilot-tracker",
              }),
            },
            {
              traceId: "trace-2",
              spanId: "span-chat-2a",
              parentSpanId: "span-root-2",
              name: "chat gpt-5-nano",
              startTimeUnixNano: "1782638301000000000",
              endTimeUnixNano: "1782638304000000000",
              attributes: attributes({
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 10,
                "gen_ai.usage.output_tokens": 20,
              }),
            },
            {
              traceId: "trace-2",
              spanId: "span-chat-2b",
              parentSpanId: "span-root-2",
              name: "chat gpt-5-nano",
              startTimeUnixNano: "1782638305000000000",
              endTimeUnixNano: "1782638309000000000",
              attributes: attributes({
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 5,
                "gen_ai.usage.output_tokens": 6,
              }),
            },
          ]),
        )}\n`,
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.requestRecordId, "otel:trace-2");
      assert.strictEqual(requests[0]?.inputTokens, 15);
      assert.strictEqual(requests[0]?.outputTokens, 26);
      assert.strictEqual(requests[0]?.totalTokens, 41);
      assert.strictEqual(requests[0]?.toolCallRoundCount, 2);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Reads Copilot OTel inference event log records", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        [
          createPlainLogRecord({
            traceId: "trace-log-1",
            spanId: "span-log-1",
            hrTime: [1782642443, 672000000],
            body: "copilot_chat.session.start",
            resourceSessionId: "vscode-session-1",
            attributes: {
              "event.name": "copilot_chat.session.start",
              "session.id": "chat-session-1",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.agent.name": "GitHub Copilot Chat",
            },
          }),
          createPlainLogRecord({
            traceId: "trace-log-1",
            spanId: "span-log-1",
            hrTime: [1782642449, 664000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "vscode-session-1",
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-log-1",
              "gen_ai.response.finish_reasons": ["stop"],
              "gen_ai.usage.input_tokens": 22266,
              "gen_ai.usage.output_tokens": 233,
            },
          }),
          createPlainLogRecord({
            traceId: "trace-log-1",
            spanId: "span-log-1",
            hrTime: [1782642449, 688000000],
            body: "copilot_chat.agent.turn: 0",
            resourceSessionId: "vscode-session-1",
            attributes: {
              "event.name": "copilot_chat.agent.turn",
              "turn.index": 0,
              "gen_ai.usage.input_tokens": 22266,
              "gen_ai.usage.output_tokens": 233,
              tool_call_count: 0,
            },
          }),
        ]
          .map((record) => JSON.stringify(record))
          .join("\n"),
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(
        requests[0]?.requestRecordId,
        "otel-log:trace-log-1:response-log-1",
      );
      assert.strictEqual(requests[0]?.requestId, "trace-log-1");
      assert.strictEqual(requests[0]?.responseId, "response-log-1");
      assert.strictEqual(requests[0]?.sessionId, "chat-session-1");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "copilot-tracker - main - gpt-5-nano",
      );
      assert.strictEqual(requests[0]?.modelId, "gpt-5-nano");
      assert.strictEqual(requests[0]?.resolvedModel, "gpt-5-nano-2025-08-07");
      assert.strictEqual(requests[0]?.inputTokens, 22266);
      assert.strictEqual(requests[0]?.outputTokens, 233);
      assert.strictEqual(requests[0]?.totalTokens, 22499);
      assert.strictEqual(requests[0]?.tokenSource, "copilot-otel");
      assert.deepStrictEqual(requests[0]?.stopReasons, ["stop"]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Uses matched VS Code chat session titles for OTel requests", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        JSON.stringify(
          createPlainLogRecord({
            traceId: "trace-title-1",
            spanId: "span-title-1",
            hrTime: [1782643951, 813000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "otel-session-title-1",
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-title-1",
              "gen_ai.usage.input_tokens": 21908,
              "gen_ai.usage.output_tokens": 907,
            },
          }),
        ),
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
        undefined,
        (request) =>
          request.traceId === "trace-title-1"
            ? {
                sessionId: "vscode-chat-session-1",
                sessionTitle:
                  "Second Copilot Tracker smoke test. What is 2 + 2?",
                sessionCreatedAt: "2026-06-28T10:52:15.138Z",
              }
            : null,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.sessionId, "vscode-chat-session-1");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "Second Copilot Tracker smoke test. What is 2 + 2?",
      );
      assert.strictEqual(
        requests[0]?.sessionCreatedAt,
        "2026-06-28T10:52:15.138Z",
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function createWorkspaceContext(): WorkspaceContext {
  return {
    workspaceId: "workspace-id",
    workspacePath: "/tmp/copilot-tracker",
    workspaceName: "copilot-tracker",
    repositoryRoot: "/tmp/copilot-tracker",
    repositoryRemoteUrl:
      "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
    branch: "main",
    defaultTask: "main",
    selectedTask: "main",
  };
}

function createResourceSpanRecord(spans: unknown[]) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: attributes({
            "service.name": "copilot-chat",
            "session.id": "vscode-window-session",
          }),
        },
        scopeSpans: [
          {
            spans,
          },
        ],
      },
    ],
  };
}

function createPlainLogRecord({
  traceId,
  spanId,
  hrTime,
  body,
  resourceSessionId,
  attributes: recordAttributes,
}: {
  traceId: string;
  spanId: string;
  hrTime: [number, number];
  body: string;
  resourceSessionId: string;
  attributes: Record<string, unknown>;
}) {
  return {
    hrTime,
    hrTimeObserved: hrTime,
    spanContext: {
      traceId,
      spanId,
      traceFlags: 1,
    },
    resource: {
      _rawAttributes: [
        ["service.name", "copilot-chat"],
        ["service.version", "0.54.0"],
        ["session.id", resourceSessionId],
      ],
      _asyncAttributesPending: false,
    },
    instrumentationScope: {
      name: "copilot-chat",
      version: "0.54.0",
    },
    attributes: recordAttributes,
    _body: body,
    totalAttributesCount: Object.keys(recordAttributes).length,
    _isReadonly: true,
    _logRecordLimits: {
      attributeCountLimit: 128,
      attributeValueLengthLimit: null,
    },
  };
}

function attributes(values: Record<string, unknown>) {
  return Object.entries(values).map(([key, value]) => ({
    key,
    value: otelValue(value),
  }));
}

function otelValue(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    return { stringValue: value };
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { intValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "boolean") {
    return { boolValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(otelValue) } };
  }

  return { stringValue: String(value) };
}
