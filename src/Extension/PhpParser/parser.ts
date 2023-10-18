import * as vscode from 'vscode'
import { BalancedCaptureResult, ParsingContext, PhpClassInfo, PhpMethodInfo } from "./types"
import { makePositionsComplete } from "./utils"

const NS_SEP = '\\'
const NS_REGEX = /namespace\s+([^;]+);/

const CLASS_REGEX = /class\s+([^\s]+)\s*/
const FUNCTION_REGEX = /function\s+([^\s]+)\s*\(/


// Export for testing.
export function captureBalanced(
	delimiter: [string, string],
	input: string,
	startOffset: number,
): BalancedCaptureResult | null {
	let offset = startOffset
	let maxOffset = input.length - 1

	// We're going to ignore right delimiters until we've found the left one
	// first.
	let foundLeftDel: boolean = false
	let insideStartOffset: number | null = null
	const leftDel: string = delimiter[0]
	const rightDel: string = delimiter[1]

	let counter = 0

	while (offset <= maxOffset) {
		const char = input[offset]

		if (char === leftDel) {
			if (!foundLeftDel) {
				insideStartOffset = offset + 1
			}
			foundLeftDel = true
			counter++
		}

		if (foundLeftDel && char === rightDel) {
			counter--
			if (counter === 0) {
				return {
					content: input.substring(insideStartOffset!, offset),
					offset: insideStartOffset!,
				} as BalancedCaptureResult
			}
		}

		offset++

	}

	if (counter) {
		// Found left delimiter, but there's not a matching pair.
		return null
	}

	return null

}


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
): PhpMethodInfo[] {
	if (!source) {
		return []
	}

	const methods: PhpMethodInfo[] = []
	const methodRegex = new RegExp(FUNCTION_REGEX.source, 'g')
	const matches = source.matchAll(methodRegex)

	for (const match of matches) {
		const where = match.index!
		const methodDef = {
			name: match[1],
			position: {
				offset: startOffset + where,
				line: null,
				character: null,
			}, // Incomplete position.
		} as PhpMethodInfo

		// Collect the incomplete positions so we can make them complete later
		// effectively (all at once within a single file).
		parsingContext.incompletePositions.push(methodDef.position)

		methods.push(methodDef)
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
		const where = match.index!
		const classBody = captureBalanced(["{", "}"], source, where)
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
				position: {
					offset: where,
					line: null,
					character: null,
				}, // Incomplete position.
			},
		} as PhpClassInfo

		// Collect the incomplete positions so we can make them complete later
		// effectively (all at once within a single file).
		parsingContext.incompletePositions.push(classDef.location.position)

		classes.push(classDef)
	}

	return classes as unknown as PhpClassInfo[]
}


export async function parsePhp(
	source: string,
	uri: vscode.Uri | null = null,
): Promise<PhpClassInfo[]> {
	const ns = detectNamespace(source)

	const parsingContext = {
		namespace: ns,
		incompletePositions: [],
		uri: uri,
	}

	const classes = extractClasses(source, parsingContext)
	makePositionsComplete(parsingContext.incompletePositions, source)

	return classes
}
