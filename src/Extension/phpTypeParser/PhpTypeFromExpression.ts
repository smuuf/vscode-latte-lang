import * as vscode from 'vscode'
import { LatteFileInfoProvider } from '../LatteFileInfoProvider'
import { METHOD_CALL_REGEX_WHOLE, QUOTED_STRING_REGEX_WHOLE } from '../regexes'
import { PhpType, parsePhpType } from './phpTypeParser'
import { getPhpTypeRepr } from './utils'
import { PhpWorkspaceInfoProvider } from '../PhpWorkspace/PhpWorkspaceInfoProvider'

export class PhpTypeFromExpression {
	constructor(public readonly expr: string | null) {}

	public async inferType(
		doc: TextDoc,
		position: vscode.Position,
		latteFileInfoProvider: LatteFileInfoProvider,
		phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider,
	): Promise<PhpType | null> {
		if (this.expr === null) {
			return null
		}

		let match = null
		match = this.expr.match(QUOTED_STRING_REGEX_WHOLE)
		if (match) {
			return parsePhpType('string')
		}

		match = this.expr.match(METHOD_CALL_REGEX_WHOLE)
		if (!match) {
			return null
		}

		const subjectVarName = match.groups!['subject'] || ''
		const methodName = match.groups!['method'] || ''
		if (!subjectVarName) {
			return null
		}

		const subjectVarInfo = await latteFileInfoProvider.getVariableInfo(
			doc,
			subjectVarName,
			position,
		)
		if (!subjectVarInfo || !subjectVarInfo.type) {
			return null
		}

		let className = getPhpTypeRepr(subjectVarInfo.type)
		const methodInfo = phpWorkspaceInfoProvider
			.getPhpClass(className)
			?.getMethod(methodName)
		if (!methodInfo || !methodInfo.returnType) {
			return null
		}

		return methodInfo.returnType
	}
}
