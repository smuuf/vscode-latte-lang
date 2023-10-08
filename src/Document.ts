import { TextDocument } from "vscode";
import { parseLatte } from "./DumbLatteParser/Parser";
import VarTag from "./DumbLatteParser/Tags/VarTag";
import VarTypeTag from "./DumbLatteParser/Tags/VarTypeTag";
import RuntimeCache from "./RuntimeCache";
import { debugMessage, isInstanceOf, narrowType } from "./helpers";

import * as vscode from 'vscode';
import DefaultTag from "./DumbLatteParser/Tags/DefaultTag";
import { resourceLimits } from "worker_threads";


export interface VariableInfo {
	name: string,
	type: string | null,
}


export interface DefinedVariable {
	variable: VariableInfo
	definedAt: vscode.Position,
}


export interface DocumentInfo {
	variables: Map<string, DefinedVariable[]>
}


export class DocumentScanner {

	public static scan(doc: TextDocument): DocumentInfo {
		debugMessage("Scanning Latte document")

		const parsed = parseLatte(doc.getText())
		const varDefs = new Map<string, DefinedVariable[]>()

		for (let tag of parsed) {
			if (!isInstanceOf(tag, VarTag, VarTypeTag, DefaultTag)) {
				continue
			}
			narrowType<VarTag | VarTypeTag | DefaultTag>(tag)

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
				continue
			}

			if (!varDefs.get(varInfo.name)) {
				varDefs.set(varInfo.name, [])
			}

			varDefs.get(varInfo.name)?.push(definedVar)
		}

		return {
			variables: varDefs,
		}

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

		const varDefs = docInfo.variables.get(varName) ?? null
		if (!varDefs) {
			return null
		}

		const foundDefinition: DefinedVariable | undefined = varDefs.findLast(
			(varDef: DefinedVariable): boolean => {
				return position.isAfterOrEqual(varDef.definedAt)
			})

		return foundDefinition ? foundDefinition.variable : null

	}

}
