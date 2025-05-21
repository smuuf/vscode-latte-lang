import { lruCache } from '../utils/lruCache.js'
import { BASIC_ITERABLES, BUILTIN_TYPES } from './definitions.js'
import * as parser from './parser/parser.js'
import { ImportContext } from './types.js'

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
	importContext: ImportContext | null = null,
): string {
	if (!importContext) {
		return name
	}

	// If the plain name is something some imported name ends with, return the
	// fully qualified imported name instead.
	// use A\B\C;
	// class X extends C {}
	// ... the result FQN is A\B\C;
	const importedName = importContext.imports.get(name)
	if (importedName) {
		return importedName
	}

	// Partial import.
	// use A\B\C;
	// class X extends C\D\E {}
	// ... the result FQN is A\B\C\D\E.
	const nsSeparatorIndex = name.indexOf('\\')
	if (nsSeparatorIndex !== -1) {
		const firstPart = name.substring(0, nsSeparatorIndex)
		const importedName = importContext.imports.get(firstPart)
		if (importedName) {
			const theRest = name.substring(nsSeparatorIndex + 1)
			return `${importedName}\\${theRest}`
		}
	}

	// If the name doesn't correspond to any of the imported names, the name
	// is in the same namespace as the file.
	if (importContext.namespace) {
		return `${importContext.namespace}\\${name}`
	}

	return name
}

function determineIterationItem(
	typeName: string,
	template: any[],
	importContext: ImportContext,
): IterationSpec {
	// Support for:
	// 1. (array|\ArrayAccess|\Iterator|\Traversable)<valueType>
	// 2. (array|\ArrayAccess|\Iterator|\Traversable)<keyType, valueType>
	typeName = normalizeTypeName(typeName, importContext)
	if (!template || !BASIC_ITERABLES.includes(typeName)) {
		return null
	}

	if (template.length === 2) {
		// someType<K, V>
		return {
			key: processTypeAst(template[0], importContext),
			value: processTypeAst(template[1], importContext),
		}
	} else if (template.length === 1) {
		// someType<V>
		return {
			value: processTypeAst(template[0], importContext),
		}
	}

	return null
}

export function normalizeTypeName(
	name: string,
	importContext: ImportContext | null = null,
): string {
	let wasAbsolute = false

	// We always refer to fully-qualified class names without their leading "\".
	if (name[0] == '\\') {
		wasAbsolute = true
		name = name.substring(1)
	}

	if (BUILTIN_TYPES.includes(name)) {
		return name
	}

	if (!wasAbsolute) {
		return resolveMaybeImportedName(name, importContext)
	}

	return name
}

/**
 * Returns a string representation For a given, possibly nested, AST
 * representing a PHP type.
 */
function stringifyTypeAst(typeAst: any, importContext: ImportContext): string {
	const union = typeAst.union as Array<any>
	if (union) {
		const list = union.map((item: any) => stringifyTypeAst(item, importContext))
		return list.join('|')
	}

	let suffix = ''
	const template = typeAst.template as Array<any>
	if (template) {
		const list = template.map((item: any) => stringifyTypeAst(item, importContext))
		suffix = `<${list.join(', ')}>`
	}

	// TODO: This breaks linking to file locations where the type is defined,
	// because the type is searched for by the repr (e.g. '\NS\MyType') and
	// a when we look for class definition of '\NS\MyType|null' we find
	// nothing.
	// const nullable = typeAst.nullable as boolean
	// if (nullable) {
	// 	suffix = `|null`
	// }

	return normalizeTypeName(typeAst.type, importContext) + suffix
}

/**
 * Build a PhpType from AST parsed from the internal "type parser".
 */
function processTypeAst(typeAst: any, importContext: ImportContext): PhpType {
	if (typeAst.union) {
		return {
			types: typeAst.union.map((item: any) => processTypeAst(item, importContext)),
			repr: stringifyTypeAst(typeAst, importContext),
			iteratesAs: null,
			nullable: false,
		}
	}

	// Convert "myType[]" to "array<MyType>"".
	if (typeAst.list) {
		typeAst.template = [
			{
				type: normalizeTypeName(typeAst.type, importContext),
				template: null,
				list: false,
				union: null,
				nullable: typeAst.nullable || false,
			},
		]
		typeAst.type = 'array'
	}

	return {
		name: normalizeTypeName(typeAst.type, importContext),
		repr: stringifyTypeAst(typeAst, importContext),
		iteratesAs: determineIterationItem(
			typeAst.type,
			typeAst.template || null,
			importContext,
		),
		nullable: typeAst.nullable || false,
	}
}

/**
 * The base, non-LRU-cached version, which is sometimes explicitly needed, if
 * the called needs to pass an additional non-JSON-stringify-able argument.
 */
function parsePhpType(
	input: string,
	importContext: ImportContext | null = null,
): PhpType | null {
	importContext ??= { namespace: '', imports: new Map() }

	try {
		return processTypeAst(parser.parse(input.trim()), importContext)
	} catch {
		return null
	}
}

const parsePhpTypeCached = lruCache(parsePhpType, 800)
export { parsePhpType, parsePhpTypeCached }
