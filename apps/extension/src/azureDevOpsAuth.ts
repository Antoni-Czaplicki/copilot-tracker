import * as vscode from "vscode";

import { logInfo, logWarn } from "./logger";

const azureDevOpsProfileScopes = [
  "499b84ac-1321-427f-aa17-267ca6975798/vso.profile",
];
const azureDevOpsWorkItemScopes = [
  ...azureDevOpsProfileScopes,
  "499b84ac-1321-427f-aa17-267ca6975798/vso.work",
];

export interface AzureDevOpsTokenOptions {
  interactive?: boolean;
  workItemAccess?: boolean;
}

export async function getAzureDevOpsToken({
  interactive = false,
  workItemAccess = false,
}: AzureDevOpsTokenOptions = {}): Promise<string | null> {
  try {
    logInfo("Requesting Azure DevOps authentication session");
    const session = await vscode.authentication.getSession(
      "microsoft",
      workItemAccess ? azureDevOpsWorkItemScopes : azureDevOpsProfileScopes,
      { createIfNone: interactive },
    );
    if (!session) {
      logInfo("Azure DevOps authentication session not available", {
        interactive,
        workItemAccess,
      });
      return null;
    }

    logInfo("Azure DevOps authentication session acquired", {
      accountLabel: session.account.label,
      scopes: session.scopes,
      interactive,
      workItemAccess,
    });
    return session.accessToken;
  } catch (error) {
    logWarn("Could not acquire Azure DevOps authentication session", {
      error: error instanceof Error ? error.message : String(error),
      interactive,
      workItemAccess,
    });
    return null;
  }
}
