import * as vscode from 'vscode'

import { parsePhpType } from './phpTypeParser/phpTypeParser'
import { LatteFileInfoProvider } from './LatteFileInfoProvider'
import { PhpWorkspaceInfoProvider } from './PhpWorkspaceInfoProvider'
import { DefinitionProviderAggregator } from './DefinitionProviders'
import { VARIABLE_REGEX } from './regexes'
import { mapMap } from './utils/utils'
import { buildCommandUri, infoMessage } from './utils/utils.vscode'

const LANG_ID = 'latte'

export class ExtensionCore {
	ctx: vscode.ExtensionContext
	latteFileInfoProvider: LatteFileInfoProvider
	phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider
	definitionProvider: DefinitionProviderAggregator

	public constructor(ctx: vscode.ExtensionContext) {
		this.ctx = ctx
		this.latteFileInfoProvider = new LatteFileInfoProvider()
		this.phpWorkspaceInfoProvider = new PhpWorkspaceInfoProvider()
		this.definitionProvider = new DefinitionProviderAggregator(this)
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
			vscode.languages.registerCompletionItemProvider(
				LANG_ID,
				new ExtensionCompletionItemProvider(this),
				'$',
				'>',
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
		let varStr = varInfo.type ? varInfo.type.repr : 'mixed'

		const classInfo = this.extCore.phpWorkspaceInfoProvider.classMap.get(varStr)
		if (classInfo && classInfo.location.uri) {
			const commandUriStr = buildCommandUri('vscode.open', [classInfo.location.uri])
			varStr = `[\`${varStr}\`](${commandUriStr})`
			md.isTrusted = true
		} else {
			varStr = `\`${varStr}\``
		}
		md.appendMarkdown(`_variable_ ${varStr} \`${varInfo.name}\``)

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
		return this.extCore.definitionProvider.resolve(doc, position, token)
	}
}

class ExtensionCompletionItemProvider implements vscode.CompletionItemProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public async provideCompletionItems(
		doc: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<vscode.CompletionItem[] | null> {
		// Get a few characters that lead to the trigger character, so we
		// get some context in which we're supposed to provide completions.
		const triggerString = doc.getText(
			new vscode.Range(position.translate(0, -2), position),
		)

		if (triggerString.endsWith('$')) {
			// Variable completion. E.g. "$...".
			const varsAtPosition =
				await this.extCore.latteFileInfoProvider.getVariablesAtPosition(
					doc,
					position,
				)
			if (token.isCancellationRequested || !varsAtPosition) {
				return null
			}

			// Create a list of completion items from variables available/known at
			// specified position.
			return Array.from(
				mapMap(varsAtPosition, (k, v) => {
					const item = new vscode.CompletionItem(
						k,
						vscode.CompletionItemKind.Variable,
					)

					// Each value of varsAtPosition under a single key (which
					// represents a variable name) is actually a list of known
					// definitions of that variable (one variable can be defined
					// multiple times in the document). Use the last one (that is:
					// the most actual definition of the variable at specified
					// position).
					item.detail = v[v.length - 1].type?.repr
					item.range = new vscode.Range(position.translate(0, -1), position)
					return item
				}).values(),
			)
		}

		// Is there a variable name in front of the "->" string which may have
		// been the trigger string?
		const variableBeforeRange = doc.getWordRangeAtPosition(
			position.translate(0, -3),
			VARIABLE_REGEX,
		)
		const variableBefore =
			(variableBeforeRange && doc.getText(variableBeforeRange)) || false
		if (triggerString.endsWith('->') && variableBefore) {
			const subjectVar = await this.extCore.latteFileInfoProvider.getVariableInfo(
				doc,
				variableBefore,
				position,
			)

			if (!subjectVar || !subjectVar.type) {
				return null
			}

			let subjectType = subjectVar.type.repr
			const subjectClass =
				this.extCore.phpWorkspaceInfoProvider.classMap.get(subjectType)

			if (!subjectClass || !subjectClass.location || !subjectClass.methods) {
				return null
			}

			// Create a list of completion items from methods in the class of
			// the type of the variable.
			return Array.from(
				mapMap(subjectClass.methods, (k, v) => {
					const item = new vscode.CompletionItem(
						k,
						vscode.CompletionItemKind.Method,
					)

					item.detail = v.name
					// Place the name of the method + parentheses and place the
					// cursor inside those parentheses (snippets support this).
					item.insertText = new vscode.SnippetString(`${k}(\${1:})`)
					return item
				}).values(),
			)
		}

		return null
	}
}
