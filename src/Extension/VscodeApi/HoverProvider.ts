import * as vscode from 'vscode'
import { METHOD_CALL_REGEX, VARIABLE_REGEX } from '../regexes'
import { ExtensionCore } from '../ExtensionCore'
import { getClassBaseName, getPhpTypeRepr } from '../phpTypeParser/utils'
import {
	buildCommandMarkdownLink,
	getOffsetAtPosition,
	getPositionAtOffset,
} from '../utils/common.vscode'
import { ELLIPSIS } from '../../constants'
import { AbstractPoi, HoverPoi, PoiType } from '../LattePois/poiTypes'

interface HoverProvider {
	resolve: (doc: TextDoc, position: vscode.Position) => HoverProviderReturnValue
}

type HoverProviderReturnValue = Promise<vscode.Hover | null>

export class HoverProviderAggregator {
	providers: Map<string, HoverProvider>

	public constructor(extCore: ExtensionCore) {
		this.providers = new Map<string, HoverProvider>()

		// Order is important!
		this.addProvider('pois', new PoiHoverProvider(extCore))
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
 * Provider hover for relevant POIs.
 */
class PoiHoverProvider {
	public constructor(private extCore: ExtensionCore) {}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
	): HoverProviderReturnValue {
		const offset = await getOffsetAtPosition(position, doc)
		const latteFileInfo = await this.extCore.latteFileInfoProvider.getLatteFileInfo(
			doc,
		)

		const found = latteFileInfo.pois.search([offset, offset + 1])
		const foundWantedPois = found.filter(
			(poi) => poi.type === PoiType.Hover,
		) as Array<HoverPoi>

		for (const item of foundWantedPois.values()) {
			return new vscode.Hover(await item.contentFn(doc, position, this.extCore))
		}

		return null
	}
}

/**
 * Provider a location of a relevant Latte variable definition in Latte file.
 */
class VariableNameHoverProvider {
	public constructor(private extCore: ExtensionCore) {}

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

		const md = new vscode.MarkdownString()
		let typeNameText = '_unknown_'

		if (varInfo) {
			const typeRepr = getPhpTypeRepr(varInfo.type)
			const classInfo =
				this.extCore.phpWorkspaceInfoProvider.getPhpClassInfo(typeRepr)

			if (classInfo && classInfo.location?.uri) {
				const typeName = varInfo ? getPhpTypeRepr(varInfo.type) : `_unknown_`

				const classPosition: vscode.Position = await getPositionAtOffset(
					classInfo.location.offset,
					classInfo.location.uri,
				)
				const classUri = vscode.Uri.parse(classInfo.location.uri).with({
					fragment: `L${classPosition.line + 1},${classPosition.character + 1}`,
				})

				typeNameText = buildCommandMarkdownLink({
					title: typeName,
					tooltip: 'Open file',
					command: 'vscode.open',
					args: [classUri],
				})

				md.isTrusted = true
			} else {
				typeNameText = `\`${typeRepr}\``
			}
		}

		md.appendMarkdown(`_variable_ \`${varName}\`\n\n_type_ ${typeNameText}`)

		return new vscode.Hover(md)
	}
}

/**
 * Provider a location of a method definition from its invocation in Latte file.
 */
class MethodCallHoverProvider {
	public constructor(private extCore: ExtensionCore) {}

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

		const className = getPhpTypeRepr(subjectVarInfo.type)
		const methodInfo = this.extCore.phpWorkspaceInfoProvider
			.getPhpClass(className)
			?.getMethod(methodName)
		if (!methodInfo || !methodInfo.location) {
			return null
		}

		const md = new vscode.MarkdownString()
		let returnTypeStr = getPhpTypeRepr(methodInfo.returnType)
		const baseClassName = getClassBaseName(className)

		const methodPosition: vscode.Position = await getPositionAtOffset(
			methodInfo.location.offset,
			methodInfo.location.uri,
		)
		const methodUri = vscode.Uri.parse(methodInfo.location.uri).with({
			fragment: `L${methodPosition.line + 1},${methodPosition.character + 1}`,
		})

		const methodLink = buildCommandMarkdownLink({
			title: `${baseClassName}::${methodInfo.name}(${ELLIPSIS})`,
			tooltip: 'Open file',
			command: 'vscode.open',
			args: [methodUri],
		})
		md.isTrusted = true
		md.appendMarkdown(`_method_ ${methodLink}\n\n_returns_ \`${returnTypeStr}\``)

		return new vscode.Hover(md)
	}
}
