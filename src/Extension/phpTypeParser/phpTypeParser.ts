import { lruCache } from '../utils/lruCache.js'
import * as parser from './parser.js'

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

/**
 * See https://www.php.net/manual/en/language.types.type-system.php
 */
const BUILTIN_TYPES = [
	'null',
	'false',
	'true',
	'bool',
	'int',
	'float',
	'string',
	'array',
	'object',
	'iterable',
	'mixed',
	'resource',
	'never',
	'void',
]

const BASIC_ITERABLES = [
	'array',
	'iterable',
	'Iterator',
	'IteratorAggregate',
	'Traversable',
	'Generator',
]

function determineIterationItem(typeName: string, template: any[]): IterationSpec {
	// Support for:
	// 1. (array|\ArrayAccess|\Iterator|\Traversable)<valueType>
	// 2. (array|\ArrayAccess|\Iterator|\Traversable)<keyType, valueType>
	typeName = maybeRemoveLeadingBackslash(typeName)
	if (template && BASIC_ITERABLES.includes(typeName)) {
		if (template.length === 2) {
			return {
				key: processTypeAst(template[0]),
				value: processTypeAst(template[1]),
			}
		} else if (template.length === 1) {
			return {
				value: processTypeAst(template[0]),
			}
		}
	}

	return null
}

export function maybeRemoveLeadingBackslash(name: string): string {
	// We refer to classes in other places by their absolute name, so add "\" if
	// it's missing./ But maybe the name of the type is not a class, but a
	// builtin PHP type, in which case don't do it.
	if (name[0] == '\\') {
		return name.substring(1)
	}

	return name
}

/**
 * Returns a string representatino For a given, possibly nested, AST
 * representing a PHP type.
 */
function stringifyType(typeAst: any): string {
	const union = typeAst.union as Array<any>
	if (union) {
		const list = union.map((item: any) => stringifyType(item))
		return list.join('|')
	}

	const template = typeAst.template as Array<any>
	if (template) {
		const list = template.map((item: any) => stringifyType(item))
		return `${maybeRemoveLeadingBackslash(typeAst.type)}<${list.join(', ')}>`
	}

	return maybeRemoveLeadingBackslash(typeAst.type)
}

/**
 * Build a PhpType from AST parsed from the internal "type parser".
 */
function processTypeAst(typeAst: any): PhpType {
	if (typeAst.union) {
		return {
			types: typeAst.union.map((item: any) => processTypeAst(item)),
			repr: stringifyType(typeAst),
			iteratesAs: null,
			nullable: false,
		}
	}

	// Convert "myType[]" to "array<MyType>"".
	if (typeAst.list) {
		typeAst.template = [
			{
				type: maybeRemoveLeadingBackslash(typeAst.type),
				template: null,
				list: false,
				union: null,
				nullable: typeAst.nullable || false,
			},
		]
		typeAst.type = 'array'
	}

	return {
		name: maybeRemoveLeadingBackslash(typeAst.type),
		repr: stringifyType(typeAst),
		iteratesAs: determineIterationItem(typeAst.type, typeAst.template || null),
		nullable: typeAst.nullable || false,
	}
}

const parsePhpType = lruCache((input: string): PhpType | null => {
	try {
		return processTypeAst(parser.parse(input))
	} catch {
		return null
	}
}, 200)

export { parsePhpType }
