import * as vscode from 'vscode'
import config from '../../config'
import { lruCache } from './lruCache'
import { isInstanceOf, isString, narrowType } from './common'

export function statusBarMessage(
	msg: string,
	prefix: string = '',
	timeout: integer | null = null,
): vscode.Disposable {
	msg = `${prefix ? prefix + ' ' : ''}[Latte] ${msg}`
	timeout = timeout ? timeout : 10 // Default timeout 10 seconds.
	return vscode.window.setStatusBarMessage(msg, timeout * 1_000)
}

export function statusBarSpinMessage(
	msg: string,
	timeout: integer | null = null,
): vscode.Disposable {
	return statusBarMessage(msg, '$(sync~spin)', timeout)
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

export const debugMessage = config.debugging
	? (msg: string): vscode.Disposable => vscode.window.setStatusBarMessage(msg, 5_000)
	: () => ({ dispose: () => {} }) // Fake disposable.

/**
 * Dumb but hopefully sufficient type guard for use at runtime.
 */
function isTextDocument(arg: any): arg is TextDoc {
	return (arg.uri || arg.fileName) && arg.languageId !== null
}

export async function uriFileExists(uri: vscode.Uri): Promise<boolean> {
	try {
		vscode.workspace.fs.stat(uri)
		return true
	} catch {
		return false
	}
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
export { _getPositionAtOffset as getPositionAtOffset }

async function getOffsetAtPosition(
	position: vscode.Position,
	doc: TextDoc | vscode.Uri | string,
): Promise<integer> {
	if (isTextDocument(doc)) {
		return doc.offsetAt(position)
	} else if (isString(doc)) {
		narrowType<string>(doc)
		doc = vscode.Uri.parse(doc)
	}

	const openedDoc: TextDoc = await vscode.workspace
		// Can also be a string (the function supports strings, too), but
		// because of TypeScript we just cast it to Uri. Whatever.
		.openTextDocument(doc as vscode.Uri)

	return openedDoc.offsetAt(position)
}

const _getOffsetAtPosition = lruCache(getOffsetAtPosition, 600)
export { _getOffsetAtPosition as getOffsetAtPosition }

export const ZeroVoidRange = new vscode.Range(
	new vscode.Position(0, 0),
	new vscode.Position(0, 0),
)
