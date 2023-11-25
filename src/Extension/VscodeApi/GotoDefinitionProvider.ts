import * as vscode from 'vscode'
import { CLASS_NAME_REGEX, METHOD_CALL_REGEX, VARIABLE_REGEX } from '../regexes'
import { ExtensionCore } from '../ExtensionCore'
import { getOffsetAtPosition, getPositionAtOffset } from '../utils/common.vscode'
import { normalizeTypeName } from '../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../phpTypeParser/utils'
import { AbstractPoi, GotoDefinitionPoi, PoiType } from '../LattePois/poiTypes'

interface GotoDefinitionProvider {
	resolve: (
		doc: TextDoc,
		position: vscode.Position,
	) => GotoDefinitionProviderReturnValue
}

type GotoDefinitionProviderReturnValue = Promise<
	vscode.Location | vscode.LocationLink[] | null
>

export class GotoDefinitionProviderAggregator {
	providers: Map<string, GotoDefinitionProvider>

	public constructor(extCore: ExtensionCore) {
		this.providers = new Map<string, GotoDefinitionProvider>()

		// Order is important!
		this.addProvider('pois', new PoiGotoDefinitionProvider(extCore))
		this.addProvider('variable', new VariableNameGotoDefinitionProvider(extCore))
		this.addProvider('methodCall', new MethodCallGotoDefinitionProvider(extCore))
		this.addProvider('class', new ClassGotoDefinitionProvider(extCore))
	}

	public addProvider(name: string, provider: GotoDefinitionProvider): void {
		this.providers.set(name, provider)
	}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<GotoDefinitionProviderReturnValue> {
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
class PoiGotoDefinitionProvider {
	public constructor(private extCore: ExtensionCore) {}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
	): GotoDefinitionProviderReturnValue {
		const offset = await getOffsetAtPosition(position, doc)
		const latteFileInfo = await this.extCore.latteFileInfoProvider.getLatteFileInfo(
			doc,
		)

		const found = latteFileInfo.pois.search([offset, offset + 1])
		const foundWantedPois = found.filter(
			(poi) => poi.type === PoiType.GotoDefinition,
		) as Array<GotoDefinitionPoi>

		for (const item of foundWantedPois.values()) {
			return item.contentFn(doc, position, this.extCore)
		}

		return null
	}
}

/**
 * Provider a location of a relevant Latte variable definition in Latte file.
 */
class VariableNameGotoDefinitionProvider {
	public constructor(private extCore: ExtensionCore) {}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
	): GotoDefinitionProviderReturnValue {
		const range = doc.getWordRangeAtPosition(position, VARIABLE_REGEX)
		if (!range) {
			return null
		}
		const varName = doc.getText(range)

		// The requested symbol is a $variable.
		if (varName) {
			const variableInfo = await this.extCore.latteFileInfoProvider.getVariableInfo(
				doc,
				varName,
				position,
			)

			if (!variableInfo || !variableInfo.definedAt) {
				return null
			}

			return new vscode.Location(doc.uri, variableInfo.definedAt)
		}

		return null
	}
}

/**
 * Provider a location of a method definition from its invocation in Latte file.
 */
class MethodCallGotoDefinitionProvider {
	public constructor(private extCore: ExtensionCore) {}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
	): GotoDefinitionProviderReturnValue {
		const range = doc.getWordRangeAtPosition(position, METHOD_CALL_REGEX)
		if (!range) {
			return null
		}

		const methodCallStr = doc.getText(range)
		const match = methodCallStr.match(METHOD_CALL_REGEX)
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

		// Start from the original range of the hover, but a sub-range of it
		// encompassing only the method name.
		const methodNameOffset = methodCallStr.indexOf('->') + 2
		const originRange = new vscode.Range(
			range.start.translate(0, methodNameOffset),
			range.start.translate(0, methodNameOffset + methodName.length),
		)

		const pos = await getPositionAtOffset(
			methodInfo.location.offset,
			methodInfo.location.uri,
		)
		const locationLink: vscode.LocationLink = {
			targetRange: new vscode.Range(pos, pos),
			targetUri: vscode.Uri.parse(methodInfo.location.uri),
			// Highlight the whole match our regex captured with the
			// name of the class.
			originSelectionRange: originRange,
		}

		return [locationLink]
	}
}

/**
 * Provider a location of a class definition from its reference in Latte file.
 */
class ClassGotoDefinitionProvider {
	public constructor(private extCore: ExtensionCore) {}

	public async resolve(
		doc: TextDoc,
		position: vscode.Position,
	): GotoDefinitionProviderReturnValue {
		const range = doc.getWordRangeAtPosition(position, CLASS_NAME_REGEX)
		if (!range) {
			return null
		}

		// We store classes under their absolute name, so if we want to find
		// the text as a class name, we must add it first.
		let className = normalizeTypeName(doc.getText(range))

		// The requested symbol is a class name.
		const classInfo = this.extCore.phpWorkspaceInfoProvider.getPhpClassInfo(className)
		if (!classInfo) {
			return null
		}

		const uri = classInfo.location?.uri
		const offset = classInfo.location?.offset
		if (!offset || !uri) {
			return null
		}

		const pos = await getPositionAtOffset(offset, uri)
		const locationLink: vscode.LocationLink = {
			targetRange: new vscode.Range(pos, pos),
			targetUri: vscode.Uri.parse(uri),
			// Highlight the whole match our regex captured with the
			// name of the class.
			originSelectionRange: range,
		}

		return [locationLink]
	}
}
