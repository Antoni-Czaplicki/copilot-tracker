import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import { WorkspaceContext } from './types';

const execFileAsync = promisify(execFile);
const selectedTaskKey = 'selectedTask';

export async function buildWorkspaceContext(context: vscode.ExtensionContext): Promise<WorkspaceContext> {
	const workspaceFolder = getWorkspaceFolder();
	const workspacePath = workspaceFolder?.uri.fsPath ?? null;
	const repositoryRoot = workspacePath ? await getRepositoryRoot(workspacePath) : null;
	const branch = repositoryRoot ? await getBranch(repositoryRoot) : null;
	const repositoryRemoteUrl = repositoryRoot ? await getRemoteUrl(repositoryRoot) : null;
	const defaultTask = branch ? getTaskFromBranch(branch) : null;
	const manuallySelectedTask = context.workspaceState.get<string>(selectedTaskKey);

	return {
		workspaceId: createWorkspaceId(workspacePath, repositoryRoot),
		workspacePath,
		workspaceName: workspaceFolder?.name ?? null,
		repositoryRoot,
		repositoryRemoteUrl,
		branch,
		defaultTask,
		selectedTask: manuallySelectedTask ?? defaultTask,
	};
}

export async function setSelectedTask(context: vscode.ExtensionContext, task: string | undefined) {
	await context.workspaceState.update(selectedTaskKey, task);
}

export function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
	const activeDocument = vscode.window.activeTextEditor?.document.uri;
	if (activeDocument) {
		const activeFolder = vscode.workspace.getWorkspaceFolder(activeDocument);
		if (activeFolder) {
			return activeFolder;
		}
	}

	return vscode.workspace.workspaceFolders?.[0];
}

export async function getRepositoryRoot(cwd: string): Promise<string | null> {
	try {
		const { stdout } = await execFileAsync('git', ['rev-parse', '--show-toplevel'], { cwd });
		return stdout.trim() || null;
	} catch {
		return null;
	}
}

export async function getBranch(cwd: string): Promise<string | null> {
	try {
		const { stdout } = await execFileAsync('git', ['branch', '--show-current'], { cwd });
		const branch = stdout.trim();
		if (branch) {
			return branch;
		}

		const detached = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { cwd });
		return detached.stdout.trim() ? `detached-${detached.stdout.trim()}` : null;
	} catch {
		return null;
	}
}

export async function getRemoteUrl(cwd: string): Promise<string | null> {
	try {
		const { stdout } = await execFileAsync('git', ['config', '--get', 'remote.origin.url'], { cwd });
		return stdout.trim() || null;
	} catch {
		return null;
	}
}

export function getTaskFromBranch(branch: string): string {
	const numberLike = branch.match(/\d+/);
	return numberLike?.[0] ?? branch;
}

function createWorkspaceId(workspacePath: string | null, repositoryRoot: string | null): string {
	const stableValue = repositoryRoot ?? workspacePath ?? 'empty-window';
	return createHash('sha256').update(stableValue).digest('hex').slice(0, 16);
}
