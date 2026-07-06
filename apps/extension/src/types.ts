import type { WorkspaceContext as WireWorkspaceContext } from "@copilot-tracker/shared";

export type {
  AuthenticatedIdentity,
  CopilotChatRequest,
  PromptTokenDetail,
  TokenSource,
  TrackerEvent,
  TrackerEventType,
} from "@copilot-tracker/shared";

/**
 * The extension augments the shared wire contract with two local-only fields
 * used to match VS Code workspace storage. The server payload schema strips
 * unknown keys, so these never persist and are not part of the shared contract.
 */
export interface WorkspaceContext extends WireWorkspaceContext {
  workspaceFolderPaths: string[];
  workspaceFilePath: string | null;
}
