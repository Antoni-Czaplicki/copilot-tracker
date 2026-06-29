import * as vscode from "vscode";

import { logInfo, logWarn } from "./logger";

const azureDevOpsScope = "499b84ac-1321-427f-aa17-267ca6975798/.default";

export async function getAzureDevOpsToken(): Promise<string | null> {
  try {
    logInfo("Requesting Azure DevOps authentication session");
    const session = await vscode.authentication.getSession(
      "microsoft",
      [azureDevOpsScope],
      { createIfNone: true },
    );
    logInfo("Azure DevOps authentication session acquired", {
      accountLabel: session.account.label,
      scopes: session.scopes,
    });
    return session.accessToken;
  } catch (error) {
    console.warn(
      "Copilot Tracker could not acquire Azure DevOps authentication session",
      error,
    );
    logWarn("Could not acquire Azure DevOps authentication session", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
