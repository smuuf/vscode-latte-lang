import * as vscode from 'vscode'
import config from '../../config'
import { isInstanceOf, narrowType } from './utils'
import { lruCache } from './lruCache'

const debugMessage = config.debugging
	? (msg: string): vscode.Disposable => vscode.window.setStatusBarMessage(msg, 5_000)
	: () => ({ dispose: () => {} }) // Fake disposable.

/**
 * Dumb but hopefully sufficient type guard for use at runtime.
 */
function isTextDocument(arg: any): arg is vscode.TextDocument {
	return (arg.uri || arg.fileName) && arg.languageId !== null
}

async function getPositionAtOffset(
	offset: integer,
	doc: vscode.TextDocument | vscode.Uri | string,
): Promise<vscode.Position> {
	if (isTextDocument(doc)) {
		return doc.positionAt(offset)
	}

	const openedDoc: vscode.TextDocument = await vscode.workspace
		// Can also be a string (the function supports strings, too), but
		// because of TypeScript we just cast it to Uri. Whatever.
		.openTextDocument(doc as vscode.Uri)

	return openedDoc.positionAt(offset)
}

const _getPositionAtOffset = lruCache(getPositionAtOffset, 600)

export { debugMessage, _getPositionAtOffset as getPositionAtOffset }

export function statusBarMessage(
	msg: string,
	prefix: string = 'Latte',
): vscode.Disposable {
	msg = prefix ? `${prefix}: ${msg}` : msg
	return vscode.window.setStatusBarMessage(msg, 20_000)
}

export function infoMessage(msg: string): void {
	vscode.window.showInformationMessage(msg)
}
