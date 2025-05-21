import { dump } from '../../utils/common'
import { normalizeTypeName, parsePhpTypeCached } from '../phpTypeParser'
import { ImportContext } from '../types'

test('Test parsing of PHP-like type hints: Basics', () => {
	expect(parsePhpTypeCached('ahoj')).toEqual({
		name: 'ahoj',
		repr: 'ahoj',
		iteratesAs: null,
		nullable: false,
	})

	expect(parsePhpTypeCached('ahoj<chuligane>')).toEqual({
		name: 'ahoj',
		repr: 'ahoj<chuligane>',
		// We don't know any in-PHP-world-well-known type "ahoj" with a generic
		// form we know what it iterates as.
		iteratesAs: null,
		nullable: false,
	})

	expect(parsePhpTypeCached('MyNamespace\\MyClass')).toEqual({
		name: 'MyNamespace\\MyClass',
		repr: 'MyNamespace\\MyClass',
		iteratesAs: null,
		nullable: false,
	})

	expect(parsePhpTypeCached('ahoj[]')).toEqual({
		name: 'array',
		repr: 'array<ahoj>',
		iteratesAs: {
			value: {
				name: 'ahoj',
				repr: 'ahoj',
				iteratesAs: null,
				nullable: false,
			},
		},
		nullable: false,
	})

	expect(parsePhpTypeCached('ahoj|vole')).toEqual({
		types: [
			{
				name: 'ahoj',
				repr: 'ahoj',
				iteratesAs: null,
				nullable: false,
			},
			{
				name: 'vole',
				repr: 'vole',
				iteratesAs: null,
				nullable: false,
			},
		],
		repr: 'ahoj|vole',
		iteratesAs: null,
		nullable: false,
	})

	expect(parsePhpTypeCached('ahoj<blazne>|vole|array<kamarade>')).toEqual({
		types: [
			{
				name: 'ahoj',
				repr: 'ahoj<blazne>',
				iteratesAs: null,
				nullable: false,
			},
			{
				name: 'vole',
				repr: 'vole',
				iteratesAs: null,
				nullable: false,
			},
			{
				name: 'array',
				repr: 'array<kamarade>',
				iteratesAs: {
					value: {
						name: 'kamarade',
						repr: 'kamarade',
						iteratesAs: null,
						nullable: false,
					},
				},
				nullable: false,
			},
		],
		repr: 'ahoj<blazne>|vole|array<kamarade>',
		iteratesAs: null,
		nullable: false,
	})
})

test('List pseudo-type', () => {
	expect(parsePhpTypeCached('list<string>')).toEqual({
		name: 'list',
		repr: 'list<string>',
		iteratesAs: {
			value: {
				name: 'string',
				repr: 'string',
				iteratesAs: null,
				nullable: false,
			},
		},
		nullable: false,
	})

	let ic: ImportContext = {
		imports: new Map(),
		namespace: 'XYZ',
	}

	expect(parsePhpTypeCached('list<string|int>', ic)).toEqual({
		name: 'list',
		repr: 'list<string|int>',
		iteratesAs: {
			value: {
				repr: 'string|int',
				types: [
					{
						name: 'string',
						repr: 'string',
						iteratesAs: null,
						nullable: false,
					},
					{
						name: 'int',
						repr: 'int',
						iteratesAs: null,
						nullable: false,
					},
				],
				iteratesAs: null,
				nullable: false,
			},
		},
		nullable: false,
	})
})

test('Nullable types', () => {
	expect(parsePhpTypeCached('?ahoj')).toEqual({
		name: 'ahoj',
		repr: 'ahoj',
		iteratesAs: null,
		nullable: true,
	})

	expect(parsePhpTypeCached('?array<int>')).toEqual({
		name: 'array',
		repr: 'array<int>',
		iteratesAs: {
			value: {
				name: 'int',
				repr: 'int',
				iteratesAs: null,
				nullable: false,
			},
		},
		nullable: true,
	})

	expect(parsePhpTypeCached('?array<?int>')).toEqual({
		name: 'array',
		repr: 'array<int>',
		iteratesAs: {
			value: {
				name: 'int',
				repr: 'int',
				iteratesAs: null,
				nullable: true,
			},
		},
		nullable: true,
	})

	expect(parsePhpTypeCached('?ahoj|vole')).toBeNull()
	expect(parsePhpTypeCached('ahoj|?vole')).toBeNull()
	expect(parsePhpTypeCached('?ahoj|?vole')).toBeNull()
})

const WELL_KNOWN_ITERABLES = [
	'array',
	'iterable',
	'Iterator',
	'IteratorAggregate',
	'Traversable',
	'Generator',
	'\\Iterator',
	'\\IteratorAggregate',
	'\\Traversable',
	'\\Generator',
]

for (const wellKnownIterable of WELL_KNOWN_ITERABLES) {
	test(`Test parsing of PHP-like type hints: Basic iterable: ${wellKnownIterable}<V>`, () => {
		expect(parsePhpTypeCached(`${wellKnownIterable}<chuligane>`)).toEqual({
			name: `${normalizeTypeName(wellKnownIterable)}`,
			repr: `${normalizeTypeName(wellKnownIterable)}<chuligane>`,
			iteratesAs: {
				value: {
					name: 'chuligane',
					repr: 'chuligane',
					iteratesAs: null,
					nullable: false,
				},
			},
			nullable: false,
		})
	})
}

for (const wellKnownIterable of WELL_KNOWN_ITERABLES) {
	test(`Test parsing of PHP-like type hints: Basic iterable: ${wellKnownIterable}<K, V>`, () => {
		expect(parsePhpTypeCached(`${wellKnownIterable}<string, chuligane>`)).toEqual({
			name: `${normalizeTypeName(wellKnownIterable)}`,
			repr: `${normalizeTypeName(wellKnownIterable)}<string, chuligane>`,
			iteratesAs: {
				key: {
					name: 'string',
					repr: 'string',
					iteratesAs: null,
					nullable: false,
				},
				value: {
					name: 'chuligane',
					repr: 'chuligane',
					iteratesAs: null,
					nullable: false,
				},
			},
			nullable: false,
		})
	})
}
