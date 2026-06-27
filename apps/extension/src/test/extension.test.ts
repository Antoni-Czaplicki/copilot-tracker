import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { getTaskFromBranch } from '../workspaceContext';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Detects Azure DevOps numeric task ids from branches', () => {
		assert.strictEqual(getTaskFromBranch('124'), '124');
		assert.strictEqual(getTaskFromBranch('124v2'), '124');
		assert.strictEqual(getTaskFromBranch('feature/124-login'), '124');
		assert.strictEqual(getTaskFromBranch('feature/ABC-123-login'), '123');
		assert.strictEqual(getTaskFromBranch('main'), 'main');
	});
});
