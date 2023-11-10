import * as vscode from 'vscode'

import { extractBaseClassName, parsePhpType } from './phpTypeParser/phpTypeParser'
import { LatteFileInfoProvider } from './LatteFileInfoProvider'
import {
	PhpWorkspaceInfoProvider,
	collectPublicMethodsFromClassInfo,
} from './PhpWorkspaceInfoProvider'
import { DefinitionProviderAggregator } from './DefinitionProviders'
import { METHOD_CALL_REGEX, VARIABLE_REGEX } from './regexes'
import { mapMap } from './utils/common'
import { buildCommandMarkdownLink, getPositionAtOffset } from './utils/common.vscode'
import { WorkspaceEvents } from './WorkspaceEvents'
import { PhpMethodInfo } from './DumbPhpParser/types'

const LANG_ID = 'latte'

export class ExtensionCore {
	public ctx: vscode.ExtensionContext
	public latteFileInfoProvider: LatteFileInfoProvider
	public phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider
	public definitionProvider: DefinitionProviderAggregator
	public workspaceEvents: WorkspaceEvents

	public onExit: (() => void)[] = []

	public constructor(ctx: vscode.ExtensionContext) {
		this.ctx = ctx
		this.workspaceEvents = new WorkspaceEvents()

		this.latteFileInfoProvider = new LatteFileInfoProvider(this)
		this.phpWorkspaceInfoProvider = new PhpWorkspaceInfoProvider(this)
		this.definitionProvider = new DefinitionProviderAggregator(this)
	}

	public registerDisposables(): void {
		const providers = [
			vscode.languages.registerHoverProvider(
				LANG_ID,
				new ExtensionHoverProvider(this),
			),
			vscode.languages.registerDefinitionProvider(
				LANG_ID,
				new ExtensionGoToDefinitionProvider(this),
			),
			vscode.languages.registerCompletionItemProvider(
				LANG_ID,
				new ExtensionCompletionItemProvider(this),
				'$', // For variable name autocompletion.
				'>', // For $object->methodName() completion.
			),
		]

		const documentEvents = [
			vscode.workspace.onDidChangeTextDocument(async (event) => {
				await this.workspaceEvents.fireDocumentChange(event.document)
			}),
			vscode.workspace.onDidCloseTextDocument(async (doc) => {
				await this.workspaceEvents.fireDocumentClose(doc)
			}),
			vscode.workspace.onDidSaveTextDocument(async (doc) => {
				await this.workspaceEvents.fireDocumentSave(doc)
			}),
		]

		const fsWatcher = vscode.workspace.createFileSystemWatcher('**/*.php')
		fsWatcher.onDidCreate(async (uri) => {
			await this.workspaceEvents.fireUriCreate(uri)
		})
		fsWatcher.onDidChange(async (uri) => {
			await this.workspaceEvents.fireUriChange(uri)
		})
		fsWatcher.onDidDelete(async (uri) => {
			await this.workspaceEvents.fireUriDelete(uri)
		})

		// By adding disposables to subscriptions we tell vscode to dispose them
		// on deactivation.
		this.ctx.subscriptions.push(...providers, ...documentEvents, fsWatcher)
	}
}

class ExtensionHoverProvider implements vscode.HoverProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public provideHover(
		doc: TextDoc,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Thenable<vscode.Hover | null> | null {
		let range: vscode.Range | undefined

		range = doc.getWordRangeAtPosition(position, VARIABLE_REGEX)
		if (range) {
			const varName = doc.getText(range)
			return this.buildVariableHover(doc, varName, position)
		}

		range = doc.getWordRangeAtPosition(position, METHOD_CALL_REGEX)
		if (range) {
			const methodCall = doc.getText(range)
			return this.buildMethodCallHover(doc, methodCall, position)
		}

		return null
	}

	public async buildVariableHover(
		doc: TextDoc,
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

		const classInfo = this.extCore.phpWorkspaceInfoProvider.getClassInfo(varStr)
		if (classInfo && classInfo.location?.uri) {
			varStr = buildCommandMarkdownLink({
				title: varStr,
				tooltip: 'Open file',
				command: 'vscode.open',
				args: [classInfo.location.uri],
			})
			md.isTrusted = true
		} else {
			varStr = `\`${varStr}\``
		}
		md.appendMarkdown(`_var_ ${varStr} \`${varInfo.name}\``)

		return new vscode.Hover(md)
	}

	public async buildMethodCallHover(
		doc: TextDoc,
		methodCall: string,
		position: vscode.Position,
	): Promise<vscode.Hover | null> {
		const match = methodCall.match(METHOD_CALL_REGEX)
		if (!match) {
			return null
		}

		const subjectVarName = match.groups!['subject'] || ''
		const methodName = match.groups!['method'] || ''
		if (!subjectVarName) {
			return null
		}

		const subjectVarInfo = await this.extCore.latteFileInfoProvider.getVariableInfo(
			doc,
			subjectVarName,
			position,
		)
		if (!subjectVarInfo || !subjectVarInfo.type || !subjectVarInfo.definedAt) {
			return null
		}

		let className = subjectVarInfo.type.repr
		const classInfo = this.extCore.phpWorkspaceInfoProvider.getClassInfo(className)
		if (!classInfo || !classInfo.location) {
			return null
		}

		const methodInfo = classInfo.methods.get(methodName)
		if (!methodInfo || !methodInfo.offset) {
			return null
		}

		const md = new vscode.MarkdownString()
		let returnTypeStr = methodInfo.returnType?.repr ?? 'mixed'
		const baseClassName = extractBaseClassName(className)

		const methodPosition: vscode.Position = await getPositionAtOffset(
			methodInfo.offset,
			classInfo.location.uri,
		)
		const methodUri = classInfo.location.uri.with({
			fragment: `L${methodPosition.line + 1},${methodPosition.character + 1}`,
		})

		const methodLink = buildCommandMarkdownLink({
			title: `${baseClassName}::${methodInfo.name}`,
			tooltip: 'Open file',
			command: 'vscode.open',
			args: [methodUri],
		})
		md.isTrusted = true
		md.appendMarkdown(`_method_ ${methodLink} _returns_ \`${returnTypeStr}\``)

		return new vscode.Hover(md)
	}
}

class ExtensionGoToDefinitionProvider implements vscode.DefinitionProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public async provideDefinition(
		doc: TextDoc,
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
		doc: TextDoc,
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
				this.extCore.phpWorkspaceInfoProvider.getClassInfo(subjectType)

			if (!subjectClass || !subjectClass.location) {
				return null
			}

			const availableMethods = collectPublicMethodsFromClassInfo(
				subjectClass,
				this.extCore.phpWorkspaceInfoProvider,
			)

			// Create a list of completion items from public methods present in
			// the class (or its parent classes) of the type of the variable.
			return availableMethods.map((method: PhpMethodInfo) => {
				const item = new vscode.CompletionItem(
					method.name,
					vscode.CompletionItemKind.Method,
				)

				const md = new vscode.MarkdownString()
				md.appendMarkdown(`**${method.name}(...)**`)
				item.documentation = md

				item.detail = method.returnType?.repr ?? 'mixed'

				// Place the name of the method + parentheses and place
				// the cursor inside those parentheses (snippets do
				// support this).
				item.insertText = new vscode.SnippetString(`${method.name}(\${1:})`)
				return item
			})
		}

		return null
	}
}
