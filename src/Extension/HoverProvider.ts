import * as vscode from 'vscode'
import { METHOD_CALL_REGEX, VARIABLE_REGEX } from './regexes'
import { ExtensionCore } from './ExtensionCore'
import { extractBaseClassName, parsePhpType } from './phpTypeParser/phpTypeParser'
import { buildCommandMarkdownLink, getPositionAtOffset } from './utils/common.vscode'

interface HoverProvider {
	resolve: (doc: TextDoc, position: vscode.Position) => HoverProviderReturnValue
}

type HoverProviderReturnValue = Promise<vscode.Hover | null>

export class HoverProviderAggregator {
	providers: Map<string, HoverProvider>

	public constructor(extCore: ExtensionCore) {
		this.providers = new Map<string, HoverProvider>()

		// Order is important!
		this.addProvider('variable', new VariableNameHoverProvider(extCore))
		this.addProvider('methodCall', new MethodCallHoverProvider(extCore))
	}

	public addProvider(name: string, provider: HoverProvider): void {
		this.providers.set(name, provider)
	}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<HoverProviderReturnValue> {
		// Go through each of the registered providers and let them do their
		// thing. The first provider to return a non-null value will win and
		// its return value will be the ultimate result.
		for (const provider of this.providers.values()) {
			if (token.isCancellationRequested) {
				return null
			}

			const result = await provider.resolve(doc, position)
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
class VariableNameHoverProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
	): HoverProviderReturnValue {
		const range = doc.getWordRangeAtPosition(position, VARIABLE_REGEX)
		if (!range) {
			return null
		}

		const varName = doc.getText(range)
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
			const classPosition: vscode.Position = await getPositionAtOffset(
				classInfo.location.offset,
				classInfo.location.uri,
			)
			const classUri = classInfo.location.uri.with({
				fragment: `L${classPosition.line + 1},${classPosition.character + 1}`,
			})

			varStr = buildCommandMarkdownLink({
				title: varStr,
				tooltip: 'Open file',
				command: 'vscode.open',
				args: [classUri],
			})

			md.isTrusted = true
		} else {
			varStr = `\`${varStr}\``
		}

		md.appendMarkdown(`_var_ ${varStr} \`${varInfo.name}\``)

		return new vscode.Hover(md)
	}
}

/**
 * Provider a location of a method definition from its invocation in Latte file.
 */
class MethodCallHoverProvider {
	extCore: ExtensionCore

	public constructor(extCore: ExtensionCore) {
		this.extCore = extCore
	}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
	): HoverProviderReturnValue {
		const range = doc.getWordRangeAtPosition(position, METHOD_CALL_REGEX)
		if (!range) {
			return null
		}

		const methodCall = doc.getText(range)
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
