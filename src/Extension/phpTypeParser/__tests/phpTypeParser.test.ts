import { maybeRemoveLeadingBackslash, parsePhpType } from '../phpTypeParser'
import { dump } from '../../utils/utils'

test('Test parsing of PHP-like type hints: Basics', () => {
	expect(parsePhpType('ahoj')).toEqual({
		name: 'ahoj',
		repr: 'ahoj',
		iteratesAs: null,
		nullable: false,
	})

	expect(parsePhpType('ahoj<chuligane>')).toEqual({
		name: 'ahoj',
		repr: 'ahoj<chuligane>',
		// We don't know any in-PHP-world-well-known type "ahoj" with a generic
		// form we know what it iterates as.
		iteratesAs: null,
		nullable: false,
	})

	expect(parsePhpType('MyNamespace\\MyClass')).toEqual({
		name: 'MyNamespace\\MyClass',
		repr: 'MyNamespace\\MyClass',
		iteratesAs: null,
		nullable: false,
	})

	expect(parsePhpType('ahoj[]')).toEqual({
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

	expect(parsePhpType('ahoj|vole')).toEqual({
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

	expect(parsePhpType('ahoj<blazne>|vole|array<kamarade>')).toEqual({
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

test('Nullable types', () => {
	expect(parsePhpType('?ahoj')).toEqual({
		name: 'ahoj',
		repr: 'ahoj',
		iteratesAs: null,
		nullable: true,
	})

	expect(parsePhpType('?array<int>')).toEqual({
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

	expect(parsePhpType('?array<?int>')).toEqual({
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

	expect(parsePhpType('?ahoj|vole')).toBeNull()
	expect(parsePhpType('ahoj|?vole')).toBeNull()
	expect(parsePhpType('?ahoj|?vole')).toBeNull()
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
		expect(parsePhpType(`${wellKnownIterable}<chuligane>`)).toEqual({
			name: `${maybeRemoveLeadingBackslash(wellKnownIterable)}`,
			repr: `${maybeRemoveLeadingBackslash(wellKnownIterable)}<chuligane>`,
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
		expect(parsePhpType(`${wellKnownIterable}<string, chuligane>`)).toEqual({
			name: `${maybeRemoveLeadingBackslash(wellKnownIterable)}`,
			repr: `${maybeRemoveLeadingBackslash(wellKnownIterable)}<string, chuligane>`,
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
