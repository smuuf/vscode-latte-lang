import * as vscode from 'vscode'

import { parsePhpType } from './TypeParser/typeParser'
import { LatteFileInfoProvider } from './LatteFileInfoProvider'
import { PhpWorkspaceInfoProvider } from './PhpWorkspaceInfoProvider'


const LANG_ID = 'latte'
const VARIABLE_REGEX = new RegExp('\\$[a-zA-Z_][a-zA-Z0-9_]*')
const CLASS_REGEX = new RegExp(`\\\\?(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\\\\[a-zA-Z_][a-zA-Z0-9_]*)*`)


export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
	const extCore = new ExtensionCore(ctx)
	extCore.registerDisposables()
}


export class ExtensionCore {

	ctx: vscode.ExtensionContext
	latteFileInfoProvider: LatteFileInfoProvider
	phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider

	public constructor(ctx: vscode.ExtensionContext) {
		this.ctx = ctx
		this.latteFileInfoProvider = new LatteFileInfoProvider()
		this.phpWorkspaceInfoProvider = new PhpWorkspaceInfoProvider()
	}

	public registerDisposables(): void {
		const disposables = [
			vscode.languages.registerHoverProvider(
				LANG_ID,
				new ExtensionHoverProvider(this),
			),
			vscode.workspace.onDidChangeTextDocument((event) => {
				if (event.document.languageId !== LANG_ID) {
					return
				}
				this.latteFileInfoProvider.forgetFileInfo(event.document)
			}),
			vscode.workspace.onDidCloseTextDocument((doc) => {
				if (doc.languageId !== LANG_ID) {
					return
				}
				this.latteFileInfoProvider.forgetFileInfo(doc)
			}),
			vscode.languages.registerDefinitionProvider(
				LANG_ID,
				new ExtensionGoToDefinitionProvider(this),
			),
		]

		// By adding disposables to subscriptions we tell vscode to dispose them
		// on deactivation.
		this.ctx.subscriptions.push(...disposables)
	}
}


class ExtensionHoverProvider implements vscode.HoverProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public provideHover(
		doc: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Thenable<vscode.Hover | null> | null {
		const range = doc.getWordRangeAtPosition(position, VARIABLE_REGEX)
		if (!range) {
			return null
		}

		const varName = doc.getText(range)
		return this.buildVariableHover(doc, varName, position)
	}

	public async buildVariableHover(
		doc: vscode.TextDocument,
		varName: string,
		position: vscode.Position,
	): Promise<vscode.Hover | null> {
		let varInfo = await this
			.extCore
			.latteFileInfoProvider
			.getVariableInfo(doc, varName, position)

		if (!varInfo) {
			varInfo = {
				name: varName,
				type: parsePhpType('unknown'),
				definedAt: null
			}
		}

		const md = new vscode.MarkdownString()
		const tmpVarType = varInfo.type
			? varInfo.type.repr
			: 'mixed'

		md.appendMarkdown(`_variable_ \`${tmpVarType} ${varInfo.name}\``)

		return new vscode.Hover(md)
	}
}


class ExtensionGoToDefinitionProvider implements vscode.DefinitionProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public async provideDefinition(
		doc: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<vscode.Location | vscode.LocationLink[] | null | undefined> {
		let range = doc.getWordRangeAtPosition(position, VARIABLE_REGEX)

		if (range) {
			const varName = doc.getText(range)

			// The requested symbol is a $variable.
			if (varName) {
				const variableInfo = await
					this
						.extCore
						.latteFileInfoProvider
						.getVariableInfo(doc, varName, position)

				if (!variableInfo || !variableInfo.definedAt) {
					return null
				}

				return new vscode.Location(doc.uri, variableInfo.definedAt)
			}
		}

		range = doc.getWordRangeAtPosition(position, CLASS_REGEX)
		if (range) {
			const className = doc.getText(range)

			// The requested symbol is a type.
			const classInfo = await
				this
					.extCore
					.phpWorkspaceInfoProvider
					.classMap.get(className)

			if (!classInfo) {
				return null
			}

			const uri = classInfo?.location?.uri
			const offset = classInfo?.location?.position?.offset
			if (!offset || !uri) {
				return null
			}

			const openedDoc: vscode.TextDocument = await vscode
				.workspace
				.openTextDocument(uri)

			const pos = openedDoc.positionAt(offset)

            const locationLink: vscode.LocationLink = {
				targetRange: new vscode.Range(pos, pos),
				targetUri: uri,
				originSelectionRange: range
			};

			return [locationLink];

		}

		return null
	}
}

