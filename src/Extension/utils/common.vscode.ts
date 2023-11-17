import * as vscode from 'vscode'
import config from '../../config'
import { lruCache } from './lruCache'
import { isInstanceOf, isString, narrowType } from './common'

export { debugMessage, _getPositionAtOffset as getPositionAtOffset }

export function statusBarMessage(msg: string, prefix: string = ''): vscode.Disposable {
	msg = `${prefix ? prefix + ' ' : ''}[Latte] ${msg}`
	return vscode.window.setStatusBarMessage(msg, 30_000)
}

export function statusBarSpinMessage(msg: string): vscode.Disposable {
	return statusBarMessage(msg, '$(sync~spin)')
}

export function infoMessage(msg: string): void {
	vscode.window.showInformationMessage(msg)
}

export function getDocUriString(doc: TextDoc): string {
	return getUriString(doc.uri)
}

export function getUriString(uri: vscode.Uri): string {
	return uri.toString()
}

export function buildCommandUri(command: string, args: object): string {
	return `command:${command}?${encodeURIComponent(JSON.stringify(args))}`
}

export function buildCommandMarkdownLink(options: {
	title: string
	tooltip: string | undefined
	command: string
	args: any[]
}): string {
	const { title, tooltip = '', command, args } = options
	const commandUriStr = buildCommandUri(command, args)
	return `[\`${title}\`](${commandUriStr} "${tooltip}")`
}

const debugMessage = config.debugging
	? (msg: string): vscode.Disposable => vscode.window.setStatusBarMessage(msg, 5_000)
	: () => ({ dispose: () => {} }) // Fake disposable.

/**
 * Dumb but hopefully sufficient type guard for use at runtime.
 */
function isTextDocument(arg: any): arg is TextDoc {
	return (arg.uri || arg.fileName) && arg.languageId !== null
}

async function getPositionAtOffset(
	offset: integer,
	doc: TextDoc | vscode.Uri | string,
): Promise<vscode.Position> {
	if (isTextDocument(doc)) {
		return doc.positionAt(offset)
	} else if (isString(doc)) {
		narrowType<string>(doc)
		doc = vscode.Uri.parse(doc)
	}

	const openedDoc: TextDoc = await vscode.workspace
		// Can also be a string (the function supports strings, too), but
		// because of TypeScript we just cast it to Uri. Whatever.
		.openTextDocument(doc as vscode.Uri)

	return openedDoc.positionAt(offset)
}

const _getPositionAtOffset = lruCache(getPositionAtOffset, 600)
