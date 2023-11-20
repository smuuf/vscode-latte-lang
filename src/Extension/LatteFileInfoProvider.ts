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
import { AbstractPoi } from './DumbLatteParser/poiTypes'
import IntervalTree from '@flatten-js/interval-tree'

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
	pois: IntervalTree<AbstractPoi>
}

export class LatteFileInfoProvider {
	cache: Map<TextDocument, LatteFileInfo>
	latteTagsProcessor: LatteTagsProcessor

	public constructor(private extCore: ExtensionCore) {
		this.cache = new Map()

		// Register file-change events.
		const workspaceEvents = extCore.workspaceEvents
		// Really "on change" and not "on save", because we want to provide
		// information about various stuff in Latte file even before saving it.
		workspaceEvents.addDocumentChangeHandler((doc: TextDoc) => {
			return this.forgetLatteFileInfo(doc)
		}, LANG_ID_LATTE)

		this.latteTagsProcessor = new LatteTagsProcessor(extCore)
	}

	public async getLatteFileInfo(doc: TextDocument): Promise<LatteFileInfo> {
		return this.cache.get(doc) || (await this.rescanFile(doc))
	}

	public async forgetLatteFileInfo(doc: TextDocument): VoidPromise {
		this.cache.delete(doc)
	}

	private async rescanFile(doc: TextDocument): Promise<LatteFileInfo> {
		// Prepare empty latte file info object beforehand. It will be mutated
		// during scanning below, but also can (and will) be queried for
		// scanned-so-far variables during that scanning.
		const latteFileInfo: LatteFileInfo = {
			externalReferences: new Set(),
			variables: new Map<variableName, VariableInfo[]>(),
			pois: new IntervalTree(),
		}

		// We immediately store the latte file info object into cache, so that
		// any methods in this LatteFileInfoProvider called during scanning,
		// which need this cache entry to exist, will not trigger another
		// rescan, which would result in a rescan-loop.
		this.cache.set(doc, latteFileInfo)

		await this.latteTagsProcessor.scan(doc, latteFileInfo)
		return latteFileInfo
	}

	public async getVariablesAtPosition(
		doc: TextDocument,
		position: vscode.Position | null,
	): Promise<VariableDefinitions | null> {
		const docInfo = await this.getLatteFileInfo(doc)
		let vars = docInfo.variables

		if (!position) {
			return vars
		}

		// Go through all definitions of known variables (there may be multiple
		// definitions of a specific variable throughout the document) in this
		// document and return only definitions of those that are known
		// (defined) before the specified position.
		return filterMap(vars, (_, varInfos: VariableInfo[]): boolean => {
			return varInfos.some((varInfo: VariableInfo) => {
				return varInfo.definedAt
					? position.isAfterOrEqual(varInfo.definedAt)
					: false
			})
		})
	}

	public async getVariableInfo(
		doc: TextDocument,
		varName: variableName,
		position: vscode.Position,
	): Promise<VariableInfo | null> {
		const docInfo = await this.getLatteFileInfo(doc)
		const varInfo = LatteFileInfoProvider.findVariableInfo(
			docInfo.variables,
			varName,
			position,
		)

		// If the variable has an expression from which we can try to infer type
		// let's do just that.
		if (varInfo?.exprType?.expr) {
			const inferredType = await varInfo.exprType.inferType(
				doc,
				position,
				this.extCore.latteFileInfoProvider,
				this.extCore.phpWorkspaceInfoProvider,
			)

			if (inferredType && inferredType.repr !== 'mixed') {
				varInfo.type = inferredType
			}
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

	public async scan(doc: TextDocument, latteFileInfo: LatteFileInfo): VoidPromise {
		const msg = debugMessage('Scanning Latte document')
		const parsed = parseLatte(doc.getText(), doc.uri.path)

		for (const tag of parsed) {
			for (const poi of tag.getPois()) {
				latteFileInfo.pois.insert(poi.range, poi)
			}

			if (isInstanceOf(tag, VarTag, VarTypeTag, DefaultTag)) {
				narrowType<VarTag | VarTypeTag | DefaultTag>(tag)
				await this.processVariableTags(latteFileInfo.variables, tag, doc)
			}
			if (isInstanceOf(tag, ForeachTag)) {
				narrowType<ForeachTag>(tag)
				await this.processForeachTag(latteFileInfo.variables, tag, doc)
			}
			if (isInstanceOf(tag, IncludeTag)) {
				narrowType<IncludeTag>(tag)
				await this.processIncludeTag(latteFileInfo.variables, tag, doc)
			}
		}

		msg.dispose()
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
			const inferredType = await iterableVarInfo.exprType.inferType(
				doc,
				position,
				this.extCore.latteFileInfoProvider,
				this.extCore.phpWorkspaceInfoProvider,
			)

			if (inferredType && inferredType.repr !== 'mixed') {
				iterableType = inferredType
			}
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
