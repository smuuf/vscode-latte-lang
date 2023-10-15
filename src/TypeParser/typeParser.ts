import { lruCache, dump } from "../helpers.js"
import * as parser from "./parser.js"

//
// BEWARE! This is a pretty chaotically botched up module just so it _somehow_
// works as expected.
//

export type PhpType = SingleType | UnionType

type UnionType = {
	types: SingleType[]
	repr: string,
	iteratesAs: IterationSpec
}
type IterationSpec = null | {value: PhpType} | {key: PhpType, value: PhpType}
type SingleType = {
	name: string,
	repr: string,
	iteratesAs: IterationSpec
}


const BASIC_ITERABLES = [
	'array',
	'iterable',
	'\\Iterator',
	'\\IteratorAggregate',
	'\\Traversable',
	'\\Generator',
]


function determineIterationItem(
	typeName: string,
	templateArgs: any[],
): IterationSpec {
	// Support for:
	// 1. (array|\ArrayAccess|\Iterator|\Traversable)<valueType>
	// 2. (array|\ArrayAccess|\Iterator|\Traversable)<keyType, valueType>
	if (templateArgs && BASIC_ITERABLES.includes(typeName)) {
		if (templateArgs.length === 2) {
			return {
				key: processTypeAst(templateArgs[0]),
				value: processTypeAst(templateArgs[1]),
			}
		} else if (templateArgs.length === 1) {
			return {
				value: processTypeAst(templateArgs[0]),
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

	const templateArgs = typeAst.templateArgs as Array<any>
	if (templateArgs) {
		const list = templateArgs.map((item: any) => stringifyType(item))
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
		}
	}

	// Convert "myType[]" to "array<MyType>"".
	if (typeAst.list) {
		typeAst.templateArgs = [{
			type: typeAst.type,
			templateArgs: null,
			list: false,
			union: null,
		}]
		typeAst.type = 'array'
	}

	return {
		name: typeAst.type,
		repr: stringifyType(typeAst),
		iteratesAs: determineIterationItem(typeAst.type, typeAst.templateArgs || null),
	}
}


const parsePhpType = lruCache((input: string): null | PhpType => {
	try {
		return processTypeAst(parser.parse(input))
	} catch {
		return null
	}
}, 200)

export { parsePhpType }
