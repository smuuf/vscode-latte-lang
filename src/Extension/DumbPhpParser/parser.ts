import * as vscode from 'vscode'
import {
	ParsingContext,
	PhpClassInfo,
	PhpClassMethods,
	PhpMethodFlags,
	PhpMethodInfo,
	SymbolVisibility,
} from './types'
import { parsePhpTypeRaw, resolveMaybeImportedName } from '../phpTypeParser/phpTypeParser'
import { captureBalanced } from '../utils/captureBalanced'
import { matchRegexFromIndex } from '../utils/common'
import { parseDocBlockString } from './docBlockParser'

const NS_REGEX = /namespace\s+([^;]+);/

const USE_IMPORT_REGEX = /^use\s+(?<import>[^\s]+);/m
const CLASS_REGEX = /class\s+(?<name>[^\s]+)(\s+extends\s+(?<parent>[^\s]+)?)?\s*/
const FUNCTION_REGEX =
	/(?<docblock>\/\*\*.*?\*\/\s+)?(?<flags>(?:[a-z]+\s+)*)function\s+(?<name>[^\s]+)\s*\(/

// This regex takes the possibility of return type being unspecified in account,
// this way it will stop where we want and will not try to find matches for
// another sections of the string containing source code of PHP class.
const RETURN_TYPE_REGEX = /\)\s*(:\s*(?<returnType>[^\s]+)\s*)?\{/

/**
 * Prepare a mapping of fully-qualified class names to their base name.
 * This makes resolving possibly imported names easier.
 *
 * E.g. {"World": "\Hello\World", ...}
 */
function prepareImportMapping(imports: string[]): Map<string, string> {
	return new Map(imports.map((n) => [n.substring(n.lastIndexOf('\\') + 1), n]))
}

function extractMethodFlags(flagsStr: string): PhpMethodFlags {
	flagsStr = flagsStr.trim()
	const flags = new Set(flagsStr.split(/\s+/))
	let visibility = SymbolVisibility.PUBLIC // Default is public.

	if (flags.has('private')) {
		visibility = SymbolVisibility.PRIVATE
	} else if (flags.has('protected')) {
		visibility = SymbolVisibility.PROTECTED
	}

	return {
		visibility: visibility,
		static: flags.has('static'),
	}
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
function detectNamespace(source: string): string {
	const match = source.match(new RegExp(NS_REGEX.source))
	if (!match) {
		return ''
	}

	return match[1]
}

/**
 * Scans the PHP source string for `use ...;` imports.
 */
function detectImports(source: string): string[] {
	const imports = []
	const importRegex = new RegExp(USE_IMPORT_REGEX.source, 'gm')
	const matches = source.matchAll(importRegex)

	for (const match of matches) {
		imports.push(match.groups!['import'])
	}

	return imports
}

function extractMethods(
	source: string | null,
	startOffset: number,
	parsingContext: ParsingContext,
): PhpClassMethods {
	const methods: PhpClassMethods = new Map()
	if (!source) {
		return methods
	}

	const methodRegex = new RegExp(FUNCTION_REGEX.source, 'gds')
	const matches = source.matchAll(methodRegex)

	for (const match of matches) {
		const where = match.indices![3][0]
		const methodName = match.groups!['name']
		const flags = match.groups!['flags'] ?? '' // "private", "protected", "static", etc.

		let returnType = 'mixed' // Default return type.

		// Extract return type defined by PHP syntax.
		const returnTypeMatch = matchRegexFromIndex(RETURN_TYPE_REGEX, source, where)
		if (returnTypeMatch) {
			returnType = returnTypeMatch.groups!['returnType'] ?? returnType
		}

		// Extract return type from docklock, if it's present.
		if (match.groups!['docblock']) {
			const docBlockData = parseDocBlockString(match.groups!['docblock'])
			const docBlockReturn = docBlockData.tags.get('return')
			if (docBlockReturn) {
				returnType = docBlockReturn
			}
		}

		const methodDef = {
			name: methodName,
			offset: startOffset + where, // Add the length of string "function ".,
			flags: extractMethodFlags(flags),
			returnType: parsePhpTypeRaw(returnType, parsingContext),
		} as PhpMethodInfo

		methods.set(methodName, methodDef)
	}

	return methods
}

function extractClasses(
	source: string | null,
	parsingContext: ParsingContext,
): PhpClassInfo[] {
	if (!source) {
		return []
	}

	const classes: PhpClassInfo[] = []
	const classRegex = new RegExp(CLASS_REGEX.source, 'gd')
	const matches = source.matchAll(classRegex)

	for (const match of matches) {
		const where = match.indices![1][0]
		const classBody = captureBalanced(['{', '}'], source, where)
		const name: string = match.groups!['name']
		let parentFqn: string = match.groups!['parent'] ?? null

		if (parentFqn) {
			parentFqn = resolveMaybeImportedName(parentFqn, parsingContext)
		}

		const classDef = {
			fqn: resolveMaybeImportedName(name, parsingContext),
			name: name,
			parentFqn: parentFqn,
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
export async function parsePhpSource(
	source: string,
	uri: vscode.Uri | null = null,
): Promise<PhpClassInfo[]> {
	const ns = detectNamespace(source)
	const imports = detectImports(source)

	const parsingContext: ParsingContext = {
		namespace: ns,
		uri: uri,
		imports: prepareImportMapping(imports),
	}

	return extractClasses(source, parsingContext)
}
