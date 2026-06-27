export interface WorkspaceContext {
	workspaceId: string;
	workspacePath: string | null;
	workspaceName: string | null;
	repositoryRoot: string | null;
	repositoryRemoteUrl: string | null;
	branch: string | null;
	defaultTask: string | null;
	selectedTask: string | null;
}

export type TrackerEventType =
	| 'extension-started'
	| 'task-changed'
	| 'branch-changed'
	| 'session-sync-started'
	| 'session-sync-finished'
	| 'session-sync-failed';

export interface TrackerEvent extends WorkspaceContext {
	eventId: string;
	eventType: TrackerEventType;
	timestamp: string;
	user: string;
	vscodeVersion: string;
	extensionVersion: string;
	payload?: Record<string, unknown>;
}

export interface PromptTokenDetail {
	category: string | null;
	label: string | null;
	percentageOfPrompt: number | null;
}

export type TokenSource = 'vscode-chat-session' | 'missing-in-vscode-chat-session';

export interface CopilotChatRequest extends WorkspaceContext {
	requestRecordId: string;
	requestId: string | null;
	responseId: string | null;
	sessionId: string;
	sessionTitle: string | null;
	sessionCreatedAt: string | null;
	requestStartedAt: string | null;
	requestCompletedAt: string | null;
	modelId: string | null;
	resolvedModel: string | null;
	modelName: string | null;
	modelVendor: string | null;
	modelFamily: string | null;
	inputTokens: number | null;
	outputTokens: number | null;
	totalTokens: number | null;
	tokenSource: TokenSource;
	promptTokenDetails: PromptTokenDetail[];
	toolCallRoundCount: number;
	stopReasons: string[];
	capturedAt: string;
}

export interface AuthenticatedIdentity {
	githubLogin: string | null;
	githubId: number | null;
	githubName: string | null;
	githubEmail: string | null;
}
