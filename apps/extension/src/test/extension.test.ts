import * as assert from "assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";

import {
  getChatSessionWatcherPatterns,
  readCopilotChatRequests,
} from "../chatStorage";
import type { TrackerConfig } from "../trackerClient";
import type { WorkspaceContext } from "../types";
import { getTaskFromBranch } from "../workspaceContext";

// import * as myExtension from '../../extension';

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

  test("Reads current VS Code chat session snapshots", async () => {
    const storageRoot = await mkdtemp(
      path.join(os.tmpdir(), "copilot-tracker-storage-"),
    );

    try {
      const workspacePath = path.join(os.tmpdir(), "copilot-tracker-workspace");
      const workspaceStorage = path.join(storageRoot, "workspace-id");
      const chatSessionsPath = path.join(workspaceStorage, "chatSessions");
      await mkdir(chatSessionsPath, { recursive: true });
      await writeFile(
        path.join(workspaceStorage, "workspace.json"),
        JSON.stringify({ folder: `file://${workspacePath}` }),
      );
      await writeFile(
        path.join(chatSessionsPath, "session-1.jsonl"),
        `${JSON.stringify({
          kind: 0,
          v: {
            sessionId: "session-1",
            creationDate: 1_700_000_000_000,
            inputState: {
              selectedModel: {
                metadata: {
                  name: "GPT Test",
                  vendor: "OpenAI",
                  family: "test",
                },
              },
            },
            requests: [
              {
                requestId: "request-1",
                responseId: "response-1",
                timestamp: 1_700_000_001_000,
                modelId: "gpt-test",
                promptTokens: 12,
                completionTokens: 34,
                response: [{ generatedTitle: "Synthetic title" }],
              },
              {
                requestId: "request-2",
                responseId: "response-2",
                timestamp: 1_700_000_003_000,
                modelId: "gpt-test",
                promptTokens: 2,
                completionTokens: 3,
                response: [{ generatedTitle: "Second synthetic title" }],
              },
            ],
          },
        })}\n${JSON.stringify({
          kind: 2,
          v: [
            {
              requestId: "request-1",
              responseId: "response-1",
              timestamp: 1_700_000_001_000,
              modelId: "gpt-test",
              result: {
                metadata: {
                  promptTokens: 50,
                  outputTokens: 5,
                  resolvedModel: "gpt-test-resolved",
                },
              },
              modelState: {
                completedAt: 1_700_000_002_000,
              },
            },
          ],
        })}\n${JSON.stringify({
          kind: 2,
          v: [
            {
              id: "chunk-1",
              kind: "text",
              value: "This is a response chunk, not a request.",
            },
            {
              id: "chunk-2",
              kind: "toolInvocationSerialized",
              value: {
                invocationMessage: "Running command",
                isComplete: true,
              },
            },
          ],
        })}\n`,
      );

      const workspaceContext: WorkspaceContext = {
        workspaceId: "workspace-id",
        workspacePath,
        workspaceName: "workspace",
        repositoryRoot: workspacePath,
        repositoryRemoteUrl: null,
        branch: "feature/123-test",
        defaultTask: "123",
        selectedTask: "123",
      };
      const config: TrackerConfig = {
        serverUrl: "https://copilot-tracker.antek.page",
        readVsCodeChatStorage: true,
        chatStoragePath: storageRoot,
        syncIntervalSeconds: 15,
      };

      const requests = await readCopilotChatRequests(workspaceContext, config);
      assert.strictEqual(requests.length, 2);
      assert.strictEqual(requests[0]?.requestRecordId, "request-1");
      assert.strictEqual(requests[0]?.sessionId, "session-1");
      assert.strictEqual(requests[0]?.sessionTitle, "Synthetic title");
      assert.strictEqual(requests[0]?.inputTokens, 50);
      assert.strictEqual(requests[0]?.outputTokens, 5);
      assert.strictEqual(requests[0]?.totalTokens, 55);
      assert.strictEqual(requests[0]?.resolvedModel, "gpt-test-resolved");
      assert.strictEqual(requests[0]?.selectedTask, "123");
      assert.strictEqual(requests[1]?.requestRecordId, "request-2");
      assert.strictEqual(requests[1]?.sessionTitle, "Second synthetic title");
      assert.strictEqual(requests[1]?.totalTokens, 5);
      assert.strictEqual(requests[1]?.selectedTask, "123");

      const reassignedRequests = await readCopilotChatRequests(
        workspaceContext,
        config,
        (request) =>
          request.requestId === "request-2"
            ? {
                branch: "feature/124-login",
                defaultTask: "124",
                selectedTask: "124",
              }
            : null,
      );
      assert.strictEqual(reassignedRequests.length, 2);
      assert.strictEqual(reassignedRequests[0]?.selectedTask, "123");
      assert.strictEqual(reassignedRequests[1]?.selectedTask, "124");
      assert.strictEqual(reassignedRequests[1]?.branch, "feature/124-login");

      const directRequests = await readCopilotChatRequests(workspaceContext, {
        ...config,
        chatStoragePath: chatSessionsPath,
      });
      assert.strictEqual(directRequests.length, 2);
      assert.strictEqual(directRequests[0]?.requestRecordId, "request-1");
    } finally {
      await rm(storageRoot, { recursive: true, force: true });
    }
  });

  test("Watches direct chatSessions overrides", () => {
    assert.deepStrictEqual(getChatSessionWatcherPatterns("/tmp/chatSessions"), [
      "*.jsonl",
      "*.json",
    ]);
    assert.deepStrictEqual(
      getChatSessionWatcherPatterns("/tmp/workspaceStorage"),
      ["**/chatSessions/*.jsonl", "**/chatSessions/*.json"],
    );
  });
});
