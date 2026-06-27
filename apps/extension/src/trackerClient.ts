import * as vscode from "vscode";

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

    const response = await fetch(new URL(path, config.serverUrl), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Copilot Tracker server returned HTTP ${response.status}`,
      );
    }
  }
}
