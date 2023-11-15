import * as vscode from 'vscode'
import { LatteFileInfoProvider } from '../LatteFileInfoProvider'
import { METHOD_CALL_REGEX } from '../regexes'
import { PhpType } from './phpTypeParser'
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

		const match = this.expr.match(METHOD_CALL_REGEX)
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
		const classInfo = phpWorkspaceInfoProvider.getClassInfo(className)
		if (!classInfo) {
			return null
		}

		const methodInfo = classInfo.methods.get(methodName)
		if (!methodInfo || !methodInfo.returnType) {
			return null
		}

		return methodInfo.returnType
	}
}
