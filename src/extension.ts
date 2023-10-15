import * as vscode from 'vscode';
import { CancellationToken, Hover, Position, TextDocument, HoverProvider } from "vscode";

import { DocumentInfoProvider } from './Document'
import { parsePhpType } from './TypeParser/typeParser';

const LANG_ID = 'latte'
const VARIABLE_REGEX = new RegExp('\\$[a-zA-Z_][a-zA-Z0-9_]*')

class ExtensionCore {

	ctx: vscode.ExtensionContext
	documentInfoProvider: DocumentInfoProvider

	public constructor(ctx: vscode.ExtensionContext) {
		this.ctx = ctx
		this.documentInfoProvider = new DocumentInfoProvider()
	}

	public registerDisposables(): void {

		const disposables = [
			vscode.languages.registerHoverProvider(LANG_ID, new ExtensionHoverProvider(this)),
			vscode.workspace.onDidChangeTextDocument((event) => {
				if (event.document.languageId !== LANG_ID) {
					return
				}
				this.documentInfoProvider.resetDocumentInfo(event.document)
			}),
			vscode.workspace.onDidCloseTextDocument((doc) => {
				if (doc.languageId !== LANG_ID) {
					return
				}
				this.documentInfoProvider.resetDocumentInfo(doc)
			}),
		]

		// By adding disposables to subscriptions we tell vscode to dispose them
		// on deactivation.
		this.ctx.subscriptions.push(...disposables);

	}

	public async buildVariableHover(
		doc: TextDocument,
		varName: string,
		position: Position,
	): Promise<Hover | null> {

		let varInfo = this.documentInfoProvider.getVariableInfo(doc, varName, position)
		if (!varInfo) {
			varInfo = {
				name: varName,
				type: parsePhpType('unknown')
			}
		}

		const md = new vscode.MarkdownString()
		const tmpVarType = varInfo.type ? varInfo.type.repr : 'mixed'
		md.appendMarkdown(`_variable_ \`${tmpVarType} ${varInfo.name}\``)

		return new Hover(md)

	}

}

class ExtensionHoverProvider implements HoverProvider {

	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public provideHover(
		document: TextDocument,
		position: Position,
		token: CancellationToken
	): Thenable<Hover | null> | null {

		const range = document.getWordRangeAtPosition(position, VARIABLE_REGEX)
		if (!range) {
			return null
		}

		const varName = document.getText(range)
		return this.extCore.buildVariableHover(document, varName, position)

    }
}

export function activate(ctx: vscode.ExtensionContext): void {
	const extCore = new ExtensionCore(ctx)
	extCore.registerDisposables()
}
