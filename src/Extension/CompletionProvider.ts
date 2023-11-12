import * as vscode from 'vscode'
import { VARIABLE_REGEX } from './regexes'
import { ExtensionCore } from './ExtensionCore'
import { mapMap } from './utils/common'
import { PhpMethodInfo } from './DumbPhpParser/types'

interface CompletionProvider {
	resolve: (
		doc: TextDoc,
		position: vscode.Position,
		triggerString: string,
	) => CompletionProviderReturnValue
}

type CompletionProviderReturnValue = Promise<vscode.CompletionItem[] | null>

export class CompletionProviderAggregator {
	providers: Map<string, CompletionProvider>

	public constructor(extCore: ExtensionCore) {
		this.providers = new Map<string, CompletionProvider>()

		// Order is important!
		this.addProvider('variable', new VariableNameCompletionProvider(extCore))
		this.addProvider('methodCall', new MethodCallCompletionProvider(extCore))
	}

	public addProvider(name: string, provider: CompletionProvider): void {
		this.providers.set(name, provider)
	}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<CompletionProviderReturnValue> {
		// Get a few characters that lead to the trigger character, so we
		// get some context in which we're supposed to provide completions.
		const triggerString = doc.getText(
			new vscode.Range(position.translate(0, -2), position),
		)

		// Go through each of the registered providers and let them do their
		// thing. The first provider to return a non-null value will win and
		// its return value will be the ultimate result.
		for (const provider of this.providers.values()) {
			if (token.isCancellationRequested) {
				return null
			}

			const result = await provider.resolve(doc, position, triggerString)
			if (result !== null) {
				return result
			}
		}

		return null
	}
}

/**
 * Provider a location of a relevant Latte variable definition in Latte file.
 */
class VariableNameCompletionProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
		triggerString: string,
	): CompletionProviderReturnValue {
		if (!triggerString.endsWith('$')) {
			return null
		}

		// Variable completion. E.g. "$...".
		const varsAtPosition =
			await this.extCore.latteFileInfoProvider.getVariablesAtPosition(doc, position)

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
}

/**
 * Provider a location of a method definition from its invocation in Latte file.
 */
class MethodCallCompletionProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
		triggerString: string,
	): CompletionProviderReturnValue {
		// Is there a variable name in front of the "->" string which may have
		// been the trigger string?
		const variableBeforeRange = doc.getWordRangeAtPosition(
			position.translate(0, -3),
			VARIABLE_REGEX,
		)

		const variableBefore =
			(variableBeforeRange && doc.getText(variableBeforeRange)) || false
		if (!triggerString.endsWith('->') || !variableBefore) {
			return null
		}
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

		const availableMethods =
			this.extCore.phpWorkspaceInfoProvider.extractPublicMethodsFromClass(
				subjectClass,
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
}
