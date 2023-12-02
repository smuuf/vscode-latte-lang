import * as vscode from 'vscode'
import { LatteFileInfoProvider } from '../LatteFileInfoProvider'
import { PhpType } from '../phpTypeParser/phpTypeParser'
import { PhpWorkspaceInfoProvider } from './PhpWorkspaceInfoProvider'
import { inferFromExpression } from './typeInferring/inferFromExpression'

export class PhpTypeFromExpression {
	constructor(public readonly expr: string | null) {}

	public async inferType(
		doc: TextDoc,
		position: vscode.Position,
		latteFileInfoProvider: LatteFileInfoProvider,
		phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider,
	): Promise<PhpType | null> {
		if (this.expr === null || !this.expr.trim()) {
			return null
		}

		return inferFromExpression(this.expr, {
			doc,
			position,
			latteFileInfoProvider,
			phpWorkspaceInfoProvider,
		})
	}
}
