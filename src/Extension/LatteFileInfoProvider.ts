import * as vscode from 'vscode'
import { TextDocument } from 'vscode'
import { parseLatte } from './DumbLatteParser/parser'
import DefaultTag from './DumbLatteParser/Tags/DefaultTag'
import VarTag from './DumbLatteParser/Tags/VarTag'
import VarTypeTag from './DumbLatteParser/Tags/VarTypeTag'
import RuntimeCache from './utils/RuntimeCache'
import { PhpType } from './TypeParser/typeParser'
import { isInstanceOf, narrowType } from './utils/utils'
import { debugMessage, getPositionAtOffset } from './utils/utils.vscode'
import ForeachTag from './DumbLatteParser/Tags/ForeachTag'

export interface VariableInfo {
	name: string
	type: PhpType | null
	definedAt: vscode.Position | null
}

type VariableDefinitions = Map<string, VariableInfo[]>

export interface LatteFileInfo {
	variables: VariableDefinitions
}

export class LatteTagsProcessor {
	public static async scan(doc: TextDocument): Promise<LatteFileInfo> {
		const msg = debugMessage('Scanning Latte document')

		const parsed = parseLatte(doc.getText())
		const varDefs = new Map<string, VariableInfo[]>()

		for (let tag of parsed) {
			if (isInstanceOf(tag, VarTag, VarTypeTag, DefaultTag)) {
				narrowType<VarTag | VarTypeTag | DefaultTag>(tag)
				await this.processVariableTags(varDefs, tag, doc)
			}
			if (isInstanceOf(tag, ForeachTag)) {
				narrowType<ForeachTag>(tag)
				await this.processForeachTag(varDefs, tag, doc)
			}
		}

		msg.dispose()

		return {
			variables: varDefs,
		}
	}

	private static async processVariableTags(
		varDefs: Map<string, VariableInfo[]>,
		tag: VarTag | VarTypeTag | DefaultTag,
		doc: vscode.TextDocument,
	): VoidPromise {
		const varInfo: VariableInfo = {
			name: tag.varName,
			type: tag.varType,
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

	private static async processForeachTag(
		varDefs: Map<string, VariableInfo[]>,
		tag: ForeachTag,
		doc: vscode.TextDocument,
	): VoidPromise {
		const varName = tag.iteratesAsVarName
		const iterableVarName = tag.iteratesVarName
		const position = await getPositionAtOffset(tag.tagRange.startOffset, doc)

		const iterableType = LatteFileInfoProvider.findVariableInfo(
			varDefs,
			iterableVarName,
			position,
		)?.type

		const varInfo: VariableInfo = {
			name: varName,
			type: iterableType?.iteratesAs ? iterableType.iteratesAs.value : null,
			definedAt: position,
		}

		if (!varDefs.get(varInfo.name)) {
			varDefs.set(varInfo.name, [])
		}

		varDefs.get(varInfo.name)?.push(varInfo)
	}
}

export class LatteFileInfoProvider {
	cache: RuntimeCache<TextDocument, LatteFileInfo>

	public constructor() {
		this.cache = new RuntimeCache()
	}

	public forgetFileInfo(doc: TextDocument): void {
		this.cache.delete(doc)
	}

	private async rescanFile(doc: TextDocument): Promise<LatteFileInfo> {
		const docInfo = await LatteTagsProcessor.scan(doc)
		this.cache.set(doc, docInfo)
		return docInfo
	}

	public async getVariableInfo(
		doc: TextDocument,
		varName: string,
		position: vscode.Position,
	): Promise<VariableInfo | null> {
		let docInfo = this.cache.get(doc)
		if (!docInfo) {
			docInfo = await this.rescanFile(doc)
		}

		return LatteFileInfoProvider.findVariableInfo(
			docInfo.variables,
			varName,
			position,
		)
	}

	public static findVariableInfo(
		variableDefinitions: VariableDefinitions,
		varName: string,
		position: vscode.Position,
	): VariableInfo | null {
		// Get all known definitions for this variable...
		const defs = variableDefinitions.get(varName) ?? null
		if (!defs) {
			return null
		}

		// ...and find the latest one for specified position.
		const foundDefinition: VariableInfo | undefined = defs.findLast(
			(varDef: VariableInfo): boolean => {
				return varDef.definedAt
					? position.isAfterOrEqual(varDef.definedAt)
					: false
			},
		)

		return foundDefinition ?? null
	}
}
