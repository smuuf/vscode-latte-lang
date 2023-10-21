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

const BASIC_ITERABLES = [
	'array',
	'iterable',
	'\\Iterator',
	'\\IteratorAggregate',
	'\\Traversable',
	'\\Generator',
]

function determineIterationItem(typeName: string, template: any[]): IterationSpec {
	// Support for:
	// 1. (array|\ArrayAccess|\Iterator|\Traversable)<valueType>
	// 2. (array|\ArrayAccess|\Iterator|\Traversable)<keyType, valueType>
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
		return `${typeAst.type}<${list.join(', ')}>`
	}

	return typeAst.type
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
				type: typeAst.type,
				template: null,
				list: false,
				union: null,
				nullable: typeAst.nullable || false,
			},
		]
		typeAst.type = 'array'
	}

	return {
		name: typeAst.type,
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
