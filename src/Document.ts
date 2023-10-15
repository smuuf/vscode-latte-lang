import * as vscode from 'vscode';
import { TextDocument } from "vscode";
import { parseLatte } from "./DumbLatteParser/Parser";
import DefaultTag from "./DumbLatteParser/Tags/DefaultTag";
import VarTag from "./DumbLatteParser/Tags/VarTag";
import VarTypeTag from "./DumbLatteParser/Tags/VarTypeTag";
import RuntimeCache from "./RuntimeCache";
import { PhpType } from "./TypeParser/typeParser";
import { isInstanceOf, narrowType } from "./helpers";
import { debugMessage } from "./helpers.vscode";
import ForeachTag from './DumbLatteParser/Tags/ForeachTag';


export interface VariableInfo {
	name: string,
	type: PhpType | null,
}


export interface DefinedVariable {
	variable: VariableInfo
	definedAt: vscode.Position,
}


type VariableDefinitions = Map<string, DefinedVariable[]>

export interface DocumentInfo {
	variables: VariableDefinitions
}


export class DocumentScanner {

	public static scan(doc: TextDocument): DocumentInfo {
		const msg = debugMessage("Scanning Latte document")

		const parsed = parseLatte(doc.getText())
		const varDefs = new Map<string, DefinedVariable[]>()

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
		varDefs: Map<string, DefinedVariable[]>,
		tag: VarTag | VarTypeTag | DefaultTag,
	): void {
		const varInfo: VariableInfo = {
			name: tag.name,
			type: tag.type,
		}

		const definedVar: DefinedVariable = {
			variable: varInfo,
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

		varDefs.get(varInfo.name)?.push(definedVar)
	}

	private static processForeachTag(
		varDefs: Map<string, DefinedVariable[]>,
		tag: ForeachTag,
	): void {
		const varName = tag.iteratesAsVariableName
		const iterableVarName = tag.iteratesVariableName
		const position = new vscode.Position(
			tag.range.start.line,
			tag.range.start.character,
		)

		const iterableType = DocumentInfoProvider.findVariableInfo(
			varDefs,
			iterableVarName,
			position,
		)?.type

		const varInfo: VariableInfo = {
			name: varName,
			type: iterableType?.iteratesAs ? iterableType.iteratesAs.value : null,
		}

		const definedVar: DefinedVariable = {
			variable: varInfo,
			definedAt: position,
		}

		if (!varDefs.get(varInfo.name)) {
			varDefs.set(varInfo.name, [])
		}

		varDefs.get(varInfo.name)?.push(definedVar)
	}

}

export class DocumentInfoProvider {

	cache: RuntimeCache<TextDocument, DocumentInfo>

	public constructor() {
		this.cache = new RuntimeCache()
	}

	public resetDocumentInfo(doc: TextDocument): void {
		this.cache.delete(doc)
	}

	public rescanDocumentInfo(doc: TextDocument): DocumentInfo {
		const docInfo = DocumentScanner.scan(doc)
		this.cache.set(doc, docInfo)
		return docInfo
	}

	public getVariableInfo(
		doc: TextDocument,
		varName: string,
		position: vscode.Position,
	): VariableInfo | null {

		let docInfo = this.cache.get(doc)
		if (!docInfo) {
			docInfo = this.rescanDocumentInfo(doc)
		}

		return DocumentInfoProvider.findVariableInfo(docInfo.variables, varName, position)

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
		const foundDefinition: DefinedVariable | undefined = defs.findLast(
			(varDef: DefinedVariable): boolean => {
				return position.isAfterOrEqual(varDef.definedAt)
			})

		return foundDefinition ? foundDefinition.variable : null
	}

}
