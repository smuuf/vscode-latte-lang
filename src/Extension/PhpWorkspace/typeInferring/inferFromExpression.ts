import * as vscode from 'vscode'
import { LatteFileInfoProvider } from '../../LatteFileInfoProvider'
import { PhpType, parsePhpType } from '../../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../../phpTypeParser/utils'
import {
	METHOD_CALL_REGEX_ALONE,
	NUMBER_LITERAL_ALONE,
	QUOTED_STRING_REGEX_ALONE,
} from '../../regexes'
import { PhpWorkspaceInfoProvider } from '../PhpWorkspaceInfoProvider'

export type InferrerFunction = (
	expr: string,
	ctx: InferringContext,
) => Promise<PhpType | null>

export type InferringContext = {
	doc: TextDoc
	position: vscode.Position
	latteFileInfoProvider: LatteFileInfoProvider
	phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider
}

const availableInferrers: InferrerFunction[] = [
	inferFromMethodCall,
	inferFromNumberLiteral,
	inferFromBoolLiteral,
	inferFromStringLiteral,
]

export async function inferFromExpression(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	for (const inferrerFn of availableInferrers) {
		const result = await inferrerFn(expr, ctx)
		if (result) {
			return result
		}
	}

	return null
}

async function inferFromMethodCall(expr: string, ctx: InferringContext) {
	const match = expr.match(METHOD_CALL_REGEX_ALONE)
	if (!match) {
		return null
	}

	const subjectVarName = match.groups!['subject'] || ''
	const methodName = match.groups!['method'] || ''
	if (!subjectVarName) {
		return null
	}

	const subjectVarInfo = await ctx.latteFileInfoProvider.getVariableInfo(
		ctx.doc,
		subjectVarName,
		ctx.position,
	)
	if (!subjectVarInfo || !subjectVarInfo.type) {
		return null
	}

	let className = getPhpTypeRepr(subjectVarInfo.type)
	const methodInfo = await (
		await ctx.phpWorkspaceInfoProvider.getPhpClass(className)
	)?.getMethod(methodName)
	if (!methodInfo || !methodInfo.returnType) {
		return null
	}

	return methodInfo.returnType
}

async function inferFromStringLiteral(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	const match = expr.match(QUOTED_STRING_REGEX_ALONE)
	if (!match) {
		return null
	}

	return parsePhpType('string')
}

async function inferFromNumberLiteral(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	const match = expr.match(NUMBER_LITERAL_ALONE)
	if (!match) {
		return null
	}

	// Group 1 would contain decimal point and decimal places.
	if (match[1]) {
		return parsePhpType('float')
	}

	return parsePhpType('int')
}

async function inferFromBoolLiteral(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	const match = expr.match(/^(?:true|false)$/i)
	if (!match) {
		return null
	}

	return parsePhpType('bool')
}
