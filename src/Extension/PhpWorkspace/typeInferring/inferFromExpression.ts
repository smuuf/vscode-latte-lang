import * as pp from 'php-parser'
import * as vscode from 'vscode'
import { LatteFileInfoProvider } from '../../LatteFileInfoProvider'
import {
	PhpType,
	normalizeTypeName,
	parsePhpTypeCached,
} from '../../phpTypeParser/phpTypeParser'
import { getPhpTypeRepr } from '../../phpTypeParser/utils'
import { PhpWorkspaceInfoProvider } from '../PhpWorkspaceInfoProvider'
import { parsePhpSnippet } from '../../phpParser/parser'
import { isString, narrowType } from '../../utils/common'
import { parseName } from '../../phpParser/AstParser'
import { NUMBER_LITERAL_ALONE } from '../../regexes'

export type GeneralInferrerFunction = (
	astNode: string,
	ctx: InferringContext,
) => Promise<PhpType | null>

export type AstInferrerFunction = (
	astNode: pp.Expression,
	ctx: InferringContext,
) => Promise<PhpType | null>

export type InferringContext = {
	doc: TextDoc
	position: vscode.Position
	latteFileInfoProvider: LatteFileInfoProvider
	phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider
}

const GENERAL_INFERRERS: GeneralInferrerFunction[] = [
	inferFromNumberLiteral,
	inferFromBoolLiteral,
	inferFromStringLiteral,
	inferFromExpressionAst,
]

const AST_INFERRERS: AstInferrerFunction[] = [
	inferFromCall,
	inferFromFauxCall,
	inferFromPropertyLookup,
]

export async function inferFromExpression(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	if (!expr.trim()) {
		return null
	}

	narrowType<pp.ExpressionStatement>(expr)
	for (const inferrerFn of GENERAL_INFERRERS) {
		const result = await inferrerFn(expr, ctx)
		if (result) {
			return result
		}
	}

	return null
}

async function inferFromExpressionAst(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	const astNode = await parsePhpSnippet(expr)
	if (!astNode) {
		return null
	}

	const singleExpr = astNode.children[0]
	if (!singleExpr || singleExpr.kind !== 'expressionstatement') {
		return null
	}

	narrowType<pp.ExpressionStatement>(singleExpr)
	for (const inferrerFn of AST_INFERRERS) {
		const result = await inferrerFn(singleExpr.expression, ctx)
		if (result) {
			return result
		}
	}

	return null
}

async function inferFromCall(astNode: pp.Expression, ctx: InferringContext) {
	if (astNode.kind !== 'call') {
		return null
	}

	narrowType<pp.Call>(astNode)
	const what = astNode.what

	// 'what' could be 'name', 'propertylookup', 'staticlookup'.
	switch (what.kind) {
		case 'name':
			narrowType<pp.Name>(what)
			return inferFromFunctionCall(what, ctx)
		case 'staticlookup':
			narrowType<pp.StaticLookup>(what)
			return inferFromMethodCall(what, ctx, true)
	}

	return null
}

async function inferFromFauxCall(astNode: pp.Empty | pp.Isset, ctx: InferringContext) {
	const fauxFnName = astNode.kind
	if (!['empty', 'isset'].includes(fauxFnName)) {
		return null
	}

	const functionInfo = await ctx.phpWorkspaceInfoProvider.getPhpFunctionInfo(fauxFnName)
	if (!functionInfo || !functionInfo.returnType) {
		return null
	}

	return functionInfo.returnType
}

async function inferFromFunctionCall(astNode: pp.Name, ctx: InferringContext) {
	const fnName = parseName(astNode.name)
	if (!fnName) {
		return null
	}

	const functionInfo = await ctx.phpWorkspaceInfoProvider.getPhpFunctionInfo(fnName)
	if (!functionInfo || !functionInfo.returnType) {
		return null
	}

	return functionInfo.returnType
}

async function inferFromPropertyLookup(astNode: pp.Expression, ctx: InferringContext) {
	if (astNode.kind !== 'propertylookup') {
		return null
	}
	narrowType<pp.PropertyLookup>(astNode)
	return null
	// const fnName = parseName(astNode.what)
	// if (!fnName) {
	// 	return null
	// }

	// const functionInfo = await ctx.phpWorkspaceInfoProvider.getPhpFunctionInfo(fnName)
	// if (!functionInfo || !functionInfo.returnType) {
	// 	return null
	// }

	// return functionInfo.returnType
}

async function inferFromMethodCall(
	astNode: pp.PropertyLookup | pp.StaticLookup,
	ctx: InferringContext,
	isStatic: boolean,
) {
	//
	// subject->methodName(...)
	//
	const subject = astNode.what
	const methodName = parseName(astNode.offset as pp.Identifier)
	if (!methodName) {
		return null
	}

	let subjectVarName = null
	switch (subject.kind) {
		case 'variable':
			//
			// Instance call:
			// $object->methodName(...)
			//
			// Or static class-stored-in-variable call.
			// $className::methodName(...)
			// NOTE: We don't handle this, because we currently don't know the
			// value of the '$className' even if it was specified directly
			// in the template (e.g. like '{var $className = MyClass::class}'
			// or '{var $className = "MyClass"}'.
			//
			narrowType<pp.Variable>(subject)
			subjectVarName = subject.name

			// Known unhandled case: The name could be not a string but an
			// expression, e.g. ${'aa' . 'a'} for accessing variable $aaa.
			if (!isString(subjectVarName)) {
				subjectVarName = null
			}

			narrowType<string>(subjectVarName)
			break
		case 'name':
			//
			// Static call:
			// MyClass::methodName(...)
			// \My\Namespace\MyClass::methodName(...)
			//
			// NOTE: Theoretically this could also mean an instance call if the
			// 'name' was a constant containing an object instance, but let's
			// disregard that possibility.
			//
			narrowType<pp.Name>(subject)
			subjectVarName = parseName(subject)
			if (!subjectVarName) {
				subjectVarName = null
			}
			break
	}

	if (!subjectVarName) {
		return null
	}

	let className = null
	if (!isStatic) {
		// Instance call - the "subject" is a variable that has some type -
		// and we want the name of the class representing the type.
		// We expect variable names with dollar sign, so add it.
		subjectVarName = `$${subjectVarName}`
		const subjectVarInfo = await ctx.latteFileInfoProvider.getVariableInfo(
			ctx.doc,
			subjectVarName,
			ctx.position,
		)
		if (!subjectVarInfo || !subjectVarInfo.type) {
			return null
		}

		className = getPhpTypeRepr(subjectVarInfo.type)
	} else {
		// Static call - the "subject" already is the class name.
		className = subjectVarName
	}

	if (!className) {
		return null
	}

	// Remove leading '\'.
	className = normalizeTypeName(className)

	const methodInfo = await (
		await ctx.phpWorkspaceInfoProvider.getPhpClass(className)
	)?.getMethod(methodName)
	if (!methodInfo || !methodInfo.returnType) {
		return null
	}

	return methodInfo.returnType
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
		return parsePhpTypeCached('float')
	}

	return parsePhpTypeCached('int')
}

async function inferFromBoolLiteral(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	const match = expr.match(/^(?:true|false)$/i)
	if (!match) {
		return null
	}

	return parsePhpTypeCached('bool')
}

async function inferFromStringLiteral(
	expr: string,
	ctx: InferringContext,
): Promise<PhpType | null> {
	const match = expr.match(/^(["']).*?\1$/i)
	if (!match) {
		return null
	}

	return parsePhpTypeCached('string')
}
