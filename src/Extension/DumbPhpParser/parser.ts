import * as vscode from 'vscode'
import { ParsingContext, PhpClassInfo, PhpClassMethods, PhpMethodInfo } from './types'
import { captureBalanced } from './utils'

const NS_SEP = '\\'
const NS_REGEX = /namespace\s+([^;]+);/

const CLASS_REGEX = /class\s+([^\s]+)\s*/
const FUNCTION_REGEX = /function\s+([^\s]+)\s*\(/

/**
 * Scans the PHP source string for namespace declaration and returns it as
 * "absolute" namespace.
 *
 * For example:
 * 1. `<?php namespace MyNamespace\Yay; ...` returns `\MyNamespace\Yay`.
 * 1. `<?php namespace MyNamespace; ...` returns `\MyNamespace`.
 * 1. `<?php $a = 1; ...` returns `\`, because no there's no namespace.
 */
// Export for testing.
export function detectNamespace(source: string): string {
	const match = source.match(new RegExp(NS_REGEX.source))
	if (!match) {
		return NS_SEP
	}

	const ns = match[1]
	if (ns[1] !== NS_SEP) {
		return `${NS_SEP}${ns}` // Add '\' if the leading slash is missing.
	}

	return ns
}

function extractMethods(
	source: string | null,
	startOffset: number,
	parsingContext: ParsingContext,
): PhpClassMethods | null {
	if (!source) {
		return null
	}

	const methods: PhpClassMethods = new Map()
	const methodRegex = new RegExp(FUNCTION_REGEX.source, 'g')
	const matches = source.matchAll(methodRegex)

	for (const match of matches) {
		const where = match.index!
		const methodName = match[1]
		const methodDef = {
			name: methodName,
			offset: startOffset + where + 9, // Add the length of string "function ".
		} as PhpMethodInfo

		methods.set(methodName, methodDef)
	}

	return methods
}

// Export for testing.
export function extractClasses(
	source: string | null,
	parsingContext: ParsingContext,
): PhpClassInfo[] {
	if (!source) {
		return []
	}

	const classes: PhpClassInfo[] = []
	const classRegex = new RegExp(CLASS_REGEX.source, 'g')
	const matches = source.matchAll(classRegex)

	for (const match of matches) {
		const where = match.index! + 6 // Add length of string "class ".
		const classBody = captureBalanced(['{', '}'], source, where)
		const name: string = match[1]

		const classDef = {
			fqn: `${parsingContext.namespace}\\${name}`,
			name: name,
			namespace: parsingContext.namespace,
			methods: extractMethods(
				classBody?.content || null,
				classBody?.offset || 0,
				parsingContext,
			),
			location: {
				uri: parsingContext.uri,
				offset: where,
			},
		} as PhpClassInfo

		classes.push(classDef)
	}

	return classes as unknown as PhpClassInfo[]
}

/**
 * Dumb-parses a PHP source code and returns information about defined classes
 * and their properties (e.g. methods).
 */
export async function parsePhp(
	source: string,
	uri: vscode.Uri | null = null,
): Promise<PhpClassInfo[]> {
	const ns = detectNamespace(source)

	const parsingContext = {
		namespace: ns,
		uri: uri,
	}

	return extractClasses(source, parsingContext)
}
