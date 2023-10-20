import * as vscode from 'vscode'

import { parsePhpType } from './TypeParser/typeParser'
import { LatteFileInfoProvider } from './LatteFileInfoProvider'
import { PhpWorkspaceInfoProvider } from './PhpWorkspaceInfoProvider'
import { getPositionAtOffset } from './utils/utils.vscode'

const LANG_ID = 'latte'
const VARIABLE_REGEX = new RegExp('\\$[a-zA-Z_][a-zA-Z0-9_]*')
const CLASS_REGEX = new RegExp(
	`\\\\?(?:[a-zA-Z_][a-zA-Z0-9_]*)(?:\\\\[a-zA-Z_][a-zA-Z0-9_]*)*`,
)
const METHOD_CALL_REGEX = new RegExp(`(\\$[a-zA-Z_][a-zA-Z0-9_]*)->([^\\(]*)`)

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
		let varInfo = await this.extCore.latteFileInfoProvider.getVariableInfo(
			doc,
			varName,
			position,
		)

		if (!varInfo) {
			varInfo = {
				name: varName,
				type: parsePhpType('unknown'),
				definedAt: null,
			}
		}

		const md = new vscode.MarkdownString()
		const tmpVarType = varInfo.type ? varInfo.type.repr : 'mixed'

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

		// Hover over a variable name.
		if (range) {
			const varName = doc.getText(range)

			// The requested symbol is a $variable.
			if (varName) {
				const variableInfo =
					await this.extCore.latteFileInfoProvider.getVariableInfo(
						doc,
						varName,
						position,
					)

				if (!variableInfo || !variableInfo.definedAt) {
					return null
				}

				return new vscode.Location(doc.uri, variableInfo.definedAt)
			}
		}

		// Hover over a method call.
		range = doc.getWordRangeAtPosition(position, METHOD_CALL_REGEX)
		if (range) {
			const methodCallStr = doc.getText(range)
			const match = methodCallStr.match(METHOD_CALL_REGEX)

			if (!match) {
				return null
			}

			const subjectVarName = match[1] || ''
			const methodName = match[2] || ''

			if (!subjectVarName) {
				return
			}
			const subjectVarInfo =
				await this.extCore.latteFileInfoProvider.getVariableInfo(
					doc,
					subjectVarName,
					position,
				)

			if (!subjectVarInfo || !subjectVarInfo.type || !subjectVarInfo.definedAt) {
				return null
			}

			let className = subjectVarInfo.type.repr
			// We store classes under their absolute name, so add "\" if it's missing.
			if (className[0] !== '\\') {
				className = `\\${className}`
			}

			// The requested symbol is a class name.
			const classInfo = await this.extCore.phpWorkspaceInfoProvider.classMap.get(
				className,
			)

			if (!classInfo) {
				return null
			}

			const methodInfo = classInfo.methods?.get(methodName)
			if (!methodInfo || !methodInfo.offset) {
				return null
			}

			const uri = classInfo?.location?.uri
			const offset = methodInfo.offset
			if (!offset || !uri) {
				return null
			}

			// Start from the original range of the hover, but a sub-range of it
			// encompassing only the method name.
			const methodNameOffset = methodCallStr.indexOf('->') + 2
			const originRange = new vscode.Range(
				range.start.translate(0, methodNameOffset),
				range.start.translate(0, methodNameOffset + methodName.length),
			)

			const pos = await getPositionAtOffset(offset, uri)
			const locationLink: vscode.LocationLink = {
				targetRange: new vscode.Range(pos, pos),
				targetUri: uri,
				// Highlight the whole match our regex captured with the
				// name of the class.
				originSelectionRange: originRange,
			}

			return [locationLink]
		}

		// Hover over a class name.
		range = doc.getWordRangeAtPosition(position, CLASS_REGEX)
		if (range) {
			let className = doc.getText(range)

			// We store classes under their absolute name, so add "\" if it's
			// missing.
			if (className[0] !== '\\') {
				className = `\\${className}`
			}

			// The requested symbol is a class name.
			const classInfo = await this.extCore.phpWorkspaceInfoProvider.classMap.get(
				className,
			)

			if (!classInfo) {
				return null
			}

			const uri = classInfo?.location?.uri
			const offset = classInfo?.location.offset
			if (!offset || !uri) {
				return null
			}

			const pos = await getPositionAtOffset(offset, uri)
			const locationLink: vscode.LocationLink = {
				targetRange: new vscode.Range(pos, pos),
				targetUri: uri,
				// Highlight the whole match our regex captured with the
				// name of the class.
				originSelectionRange: range,
			}

			return [locationLink]
		}

		return null
	}
}
