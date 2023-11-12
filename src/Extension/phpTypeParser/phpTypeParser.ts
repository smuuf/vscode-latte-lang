import { lruCache } from '../utils/lruCache.js'
import { BASIC_ITERABLES, BUILTIN_TYPES } from './definitions.js'
import * as parser from './parser/parser.js'
import { ParsingContext } from './types.js'

//
// BEWARE! This is a pretty chaotically put together module just so it _somehow_
// works as expected.
//

export type PhpType = SingleType | UnionType

type UnionType = {
	types: SingleType[]
	repr: string
	iteratesAs: IterationSpec
	nullable: boolean
}
type IterationSpec = null | { value: PhpType } | { key: PhpType; value: PhpType }
type SingleType = {
	name: string
	repr: string
	iteratesAs: IterationSpec
	nullable: boolean
}

export function resolveMaybeImportedName(
	name: string,
	parsingContext: ParsingContext | null = null,
): string {
	if (parsingContext) {
		// If the plain name is something some imported name ends with, return the
		// fully qualified imported name instead.
		const importedName = parsingContext.imports.get(name)
		if (importedName) {
			return importedName
		}

		// If the name doesn't correspond to any of the imported names, the name
		// is in the same namespace as the file.
		if (parsingContext.namespace) {
			return `${parsingContext.namespace}\\${name}`
		}
	}

	return name
}

function determineIterationItem(
	typeName: string,
	template: any[],
	parsingContext: ParsingContext,
): IterationSpec {
	// Support for:
	// 1. (array|\ArrayAccess|\Iterator|\Traversable)<valueType>
	// 2. (array|\ArrayAccess|\Iterator|\Traversable)<keyType, valueType>
	typeName = normalizeTypeName(typeName, parsingContext)
	if (template && BASIC_ITERABLES.includes(typeName)) {
		if (template.length === 2) {
			// someType<K, V>
			return {
				key: processTypeAst(template[0], parsingContext),
				value: processTypeAst(template[1], parsingContext),
			}
		} else if (template.length === 1) {
			// someType<V>
			return {
				value: processTypeAst(template[0], parsingContext),
			}
		}
	}

	return null
}

export function normalizeTypeName(
	name: string,
	parsingContext: ParsingContext | null = null,
): string {
	// We always refer to fully-qualified class names without their leading "\".
	if (name[0] == '\\') {
		name = name.substring(1)
	}

	if (BUILTIN_TYPES.includes(name)) {
		return name
	}

	return resolveMaybeImportedName(name, parsingContext)
}

/**
 * Returns a string representation For a given, possibly nested, AST
 * representing a PHP type.
 */
function stringifyTypeAst(typeAst: any, parsingContext: ParsingContext): string {
	const union = typeAst.union as Array<any>
	if (union) {
		const list = union.map((item: any) => stringifyTypeAst(item, parsingContext))
		return list.join('|')
	}

	const template = typeAst.template as Array<any>
	if (template) {
		const list = template.map((item: any) => stringifyTypeAst(item, parsingContext))
		return `${normalizeTypeName(typeAst.type, parsingContext)}<${list.join(', ')}>`
	}

	return normalizeTypeName(typeAst.type, parsingContext)
}

/**
 * Build a PhpType from AST parsed from the internal "type parser".
 */
function processTypeAst(typeAst: any, parsingContext: ParsingContext): PhpType {
	if (typeAst.union) {
		return {
			types: typeAst.union.map((item: any) => processTypeAst(item, parsingContext)),
			repr: stringifyTypeAst(typeAst, parsingContext),
			iteratesAs: null,
			nullable: false,
		}
	}

	// Convert "myType[]" to "array<MyType>"".
	if (typeAst.list) {
		typeAst.template = [
			{
				type: normalizeTypeName(typeAst.type, parsingContext),
				template: null,
				list: false,
				union: null,
				nullable: typeAst.nullable || false,
			},
		]
		typeAst.type = 'array'
	}

	return {
		name: normalizeTypeName(typeAst.type, parsingContext),
		repr: stringifyTypeAst(typeAst, parsingContext),
		iteratesAs: determineIterationItem(
			typeAst.type,
			typeAst.template || null,
			parsingContext,
		),
		nullable: typeAst.nullable || false,
	}
}

/**
 * The base, non-LRU-cached version, which is sometimes explicitly needed, if
 * the called needs to pass an additional non-JSON-stringifyable argument.
 */
function parsePhpTypeRaw(
	input: string,
	parsingContext: ParsingContext | null = null,
): PhpType | null {
	parsingContext ??= { namespace: '', imports: new Map() }

	try {
		return processTypeAst(parser.parse(input), parsingContext)
	} catch {
		return null
	}
}

const parsePhpType = lruCache(parsePhpTypeRaw, 200)
export { parsePhpTypeRaw, parsePhpType }
