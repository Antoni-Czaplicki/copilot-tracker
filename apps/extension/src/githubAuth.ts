import * as vscode from 'vscode';

export async function getGitHubToken(): Promise<string | null> {
	try {
		const session = await vscode.authentication.getSession('github', ['read:user'], { createIfNone: true });
		return session.accessToken;
	} catch (error) {
		console.warn('Copilot Tracker could not acquire GitHub authentication session', error);
		return null;
	}
}
