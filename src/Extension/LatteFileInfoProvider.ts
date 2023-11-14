import * as vscode from 'vscode'
import { TextDocument } from 'vscode'
import { parseLatte } from './DumbLatteParser/latteParser'
import DefaultTag from './DumbLatteParser/Tags/DefaultTag'
import VarTag from './DumbLatteParser/Tags/VarTag'
import VarTypeTag from './DumbLatteParser/Tags/VarTypeTag'
import { PhpType } from './phpTypeParser/phpTypeParser'
import { filterMap, isInstanceOf, narrowType } from './utils/common'
import { debugMessage, getPositionAtOffset } from './utils/common.vscode'
import ForeachTag from './DumbLatteParser/Tags/ForeachTag'
import IncludeTag from './DumbLatteParser/Tags/IncludeTag'
import { ExtensionCore } from './ExtensionCore'
import { LANG_ID_LATTE } from '../constants'
import { PhpTypeFromExpression } from './phpTypeParser/PhpTypeFromExpression'

export type VariableInfo = {
	name: string
	type: PhpType | null
	exprType: PhpTypeFromExpression | null
	definedAt: vscode.Position | null
}

type VariableDefinitions = Map<variableName, VariableInfo[]>

export type LatteFileInfo = {
	externalReferences: Set<string>
	variables: VariableDefinitions
}

export class LatteFileInfoProvider {
	cache: Map<TextDocument, LatteFileInfo>
	latteTagsProcessor: LatteTagsProcessor
	scanningInProgress: Set<TextDoc>

	public constructor(private extCore: ExtensionCore) {
		this.cache = new Map()
		this.scanningInProgress = new Set()

		// Register file-change events.
		const workspaceEvents = extCore.workspaceEvents
		// Really "on change" and not "on save", because we want to provide
		// information about various stuff in Latte file even before saving it.
		workspaceEvents.addDocumentChangeHandler((doc: TextDoc) => {
			return this.forgetLatteFileInfo(doc)
		}, LANG_ID_LATTE)

		this.latteTagsProcessor = new LatteTagsProcessor(extCore)
	}

	public async forgetLatteFileInfo(doc: TextDocument): VoidPromise {
		this.cache.delete(doc)
	}

	private async rescanFile(doc: TextDocument): Promise<LatteFileInfo | null> {
		// Avoid rescan infinite-loop. PhpTypeFromExpression can cause this,
		// because it can be asked to infer type during scanning of the
		// document, but PhpTypeFromExpression itself can cause a rescan,
		// because it calls 'getVariableInfo'.
		if (this.scanningInProgress.has(doc)) {
			return null
		}

		this.scanningInProgress.add(doc)
		const docInfo = await this.latteTagsProcessor.scan(doc)
		this.scanningInProgress.delete(doc)

		this.cache.set(doc, docInfo)
		return docInfo
	}

	public async getVariablesAtPosition(
		doc: TextDocument,
		position: vscode.Position | null,
	): Promise<VariableDefinitions | null> {
		let docInfo = this.cache.get(doc) || null
		if (!docInfo) {
			docInfo = await this.rescanFile(doc)
			if (!docInfo) {
				return null
			}
		}

		let vars = docInfo.variables
		if (!position) {
			return vars
		}

		// Go through all definitions of known variables (there may be multiple
		// definitions of a specific variable throughout the document) in this
		// document and return only definitions of those that are known
		// (defined) before the specified position.
		return filterMap(
			vars,
			(varName: variableName, varInfos: VariableInfo[]): boolean => {
				return varInfos.some((varInfo: VariableInfo) => {
					return varInfo.definedAt
						? position.isAfterOrEqual(varInfo.definedAt)
						: false
				})
			},
		)
	}

	public async getVariableInfo(
		doc: TextDocument,
		varName: variableName,
		position: vscode.Position,
	): Promise<VariableInfo | null> {
		let docInfo = this.cache.get(doc) || null
		if (!docInfo) {
			docInfo = await this.rescanFile(doc)
			if (!docInfo) {
				return null
			}
		}

		const varInfo = LatteFileInfoProvider.findVariableInfo(
			docInfo.variables,
			varName,
			position,
		)

		// If the variable has an expression from which we can try to infer type
		// let's do just that.
		if (varInfo?.exprType?.expr) {
			varInfo.type = await varInfo.exprType.inferType(
				doc,
				position,
				this.extCore.latteFileInfoProvider,
				this.extCore.phpWorkspaceInfoProvider,
			)
		}

		return varInfo
	}

	public static findVariableInfo(
		variableDefinitions: VariableDefinitions,
		varName: variableName,
		position: vscode.Position,
	): VariableInfo | null {
		// Get all known definitions for this variable...
		const defs = variableDefinitions.get(varName) ?? null
		if (!defs) {
			return null
		}

		// ...and find the latest one for specified position.
		const foundDefinition: VariableInfo | undefined = defs.findLast(
			(varInfo: VariableInfo): boolean => {
				return varInfo.definedAt
					? position.isAfterOrEqual(varInfo.definedAt)
					: false
			},
		)

		return foundDefinition ?? null
	}
}

export class LatteTagsProcessor {
	public constructor(private extCore: ExtensionCore) {}

	public async scan(doc: TextDocument): Promise<LatteFileInfo> {
		const msg = debugMessage('Scanning Latte document')

		const parsed = parseLatte(doc.getText())
		const varDefs = new Map<variableName, VariableInfo[]>()

		for (const tag of parsed) {
			if (isInstanceOf(tag, VarTag, VarTypeTag, DefaultTag)) {
				narrowType<VarTag | VarTypeTag | DefaultTag>(tag)
				await this.processVariableTags(varDefs, tag, doc)
			}
			if (isInstanceOf(tag, ForeachTag)) {
				narrowType<ForeachTag>(tag)
				await this.processForeachTag(varDefs, tag, doc)
			}
			if (isInstanceOf(tag, IncludeTag)) {
				narrowType<IncludeTag>(tag)
				await this.processIncludeTag(varDefs, tag, doc)
			}
		}

		msg.dispose()

		return {
			externalReferences: new Set(),
			variables: varDefs,
		}
	}

	private async processVariableTags(
		varDefs: Map<variableName, VariableInfo[]>,
		tag: VarTag | VarTypeTag | DefaultTag,
		doc: TextDoc,
	): VoidPromise {
		const varInfo: VariableInfo = {
			name: tag.varName,
			type: tag.varType,
			exprType: new PhpTypeFromExpression(tag.expression),
			definedAt: await getPositionAtOffset(tag.nameOffset, doc),
		}

		// We're interested in gathering types, so don't overwrite
		// already discovered type of a variable with something without
		// a specified type. Thus, {var $ahoj} will not discard a type
		// discovered from previous {var MyType $ahoj}.
		if (varDefs.get(varInfo.name)?.length && !varInfo.type) {
			return
		}

		if (!varDefs.get(varInfo.name)) {
			varDefs.set(varInfo.name, [])
		}

		varDefs.get(varInfo.name)?.push(varInfo)
	}

	private async processForeachTag(
		varDefs: Map<variableName, VariableInfo[]>,
		tag: ForeachTag,
		doc: TextDoc,
	): VoidPromise {
		const varName = tag.iteratesAsVarName
		const iterableVarName = tag.iteratesVarName
		const position = await getPositionAtOffset(tag.tagRange.startOffset, doc)

		const iterableVarInfo = LatteFileInfoProvider.findVariableInfo(
			varDefs,
			iterableVarName,
			position,
		)

		let iterableType = iterableVarInfo?.type
		// If the variable has an expression from which we can try to infer type
		// let's do just that.
		if (iterableVarInfo?.exprType?.expr) {
			iterableType = await iterableVarInfo.exprType.inferType(
				doc,
				position,
				this.extCore.latteFileInfoProvider,
				this.extCore.phpWorkspaceInfoProvider,
			)
		}

		const varInfo: VariableInfo = {
			name: varName,
			type: iterableType?.iteratesAs?.value ?? null,
			exprType: null,
			definedAt: position,
		}

		if (!varDefs.get(varInfo.name)) {
			varDefs.set(varInfo.name, [])
		}

		varDefs.get(varInfo.name)?.push(varInfo)
	}

	private async processIncludeTag(
		varDefs: Map<variableName, VariableInfo[]>,
		tag: IncludeTag,
		doc: TextDoc,
	): VoidPromise {
		// TODO
	}
}
