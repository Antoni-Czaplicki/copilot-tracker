import * as vscode from "vscode";

import { logInfo, logWarn } from "./logger";
import { CopilotChatRequest, TrackerEvent } from "./types";

const extensionId = "copilot-tracker";

export interface TrackerConfig {
  serverUrl: string;
  readVsCodeChatStorage: boolean;
  chatStoragePath: string;
  syncIntervalSeconds: number;
}

export function getTrackerConfig(): TrackerConfig {
  const config = vscode.workspace.getConfiguration(extensionId);
  return {
    serverUrl: config.get<string>("serverUrl", "http://localhost:3737"),
    readVsCodeChatStorage: config.get<boolean>("readVsCodeChatStorage", true),
    chatStoragePath: config.get<string>("chatStoragePath", ""),
    syncIntervalSeconds: Math.max(
      5,
      config.get<number>("syncIntervalSeconds", 15),
    ),
  };
}

export class TrackerClient {
  public constructor(private readonly getToken: () => Promise<string | null>) {}

  public async sendEvent(event: TrackerEvent): Promise<void> {
    await this.post("/api/events", event);
  }

  public async sendChatRequests(requests: CopilotChatRequest[]): Promise<void> {
    if (requests.length === 0) {
      logInfo("Skipping chat request POST because there are no requests");
      return;
    }

    await this.post("/api/chat-requests/batch", { requests });
  }

  private async post(path: string, body: unknown): Promise<void> {
    const config = getTrackerConfig();
    const token = await this.getToken();
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    const url = new URL(path, config.serverUrl);
    logInfo("Posting to Copilot Tracker server", {
      path,
      serverUrl: config.serverUrl,
      hasToken: Boolean(token),
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const responseBody = await readResponseBody(response);
    logInfo("Copilot Tracker server responded", {
      path,
      status: response.status,
      ok: response.ok,
      responseBody,
    });

    if (!response.ok) {
      logWarn("Copilot Tracker server returned an error", {
        path,
        status: response.status,
      });
      throw new Error(
        `Copilot Tracker server returned HTTP ${response.status}`,
      );
    }
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
