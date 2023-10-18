import * as vscode from 'vscode'
import { TextDocument } from "vscode"
import { parseLatte } from "./DumbLatteParser/parser"
import DefaultTag from "./DumbLatteParser/Tags/DefaultTag"
import VarTag from "./DumbLatteParser/Tags/VarTag"
import VarTypeTag from "./DumbLatteParser/Tags/VarTypeTag"
import RuntimeCache from "./utils/RuntimeCache"
import { PhpType } from "./TypeParser/typeParser"
import { isInstanceOf, narrowType } from "./utils/utils"
import { debugMessage } from "./utils/utils.vscode"
import ForeachTag from './DumbLatteParser/Tags/ForeachTag'


export interface VariableInfo {
	name: string,
	type: PhpType | null,
	definedAt: vscode.Position | null,
}


type VariableDefinitions = Map<string, VariableInfo[]>


export interface LatteFileInfo {
	variables: VariableDefinitions
}


export class LatteTagsProcessor {

	public static scan(doc: TextDocument): LatteFileInfo {
		const msg = debugMessage("Scanning Latte document")

		const parsed = parseLatte(doc.getText())
		const varDefs = new Map<string, VariableInfo[]>()

		for (let tag of parsed) {
			if (isInstanceOf(tag, VarTag, VarTypeTag, DefaultTag)) {
				narrowType<VarTag | VarTypeTag | DefaultTag>(tag)
				this.processVariableTags(varDefs, tag)
			}
			if (isInstanceOf(tag, ForeachTag)) {
				narrowType<ForeachTag>(tag)
				this.processForeachTag(varDefs, tag)
			}
		}

		msg.dispose()

		return {
			variables: varDefs,
		}

	}

	private static processVariableTags(
		varDefs: Map<string, VariableInfo[]>,
		tag: VarTag | VarTypeTag | DefaultTag,
	): void {
		const varInfo: VariableInfo = {
			name: tag.name,
			type: tag.type,
			definedAt: new vscode.Position(
				tag.range.start.line,
				tag.range.start.character,
			),
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

	private static processForeachTag(
		varDefs: Map<string, VariableInfo[]>,
		tag: ForeachTag,
	): void {
		const varName = tag.iteratesAsVariableName
		const iterableVarName = tag.iteratesVariableName
		const position = new vscode.Position(
			tag.range.start.line,
			tag.range.start.character,
		)

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
		const docInfo = LatteTagsProcessor.scan(doc)
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

		return LatteFileInfoProvider.findVariableInfo(docInfo.variables, varName, position)
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
			})

		return foundDefinition ?? null
	}

}
