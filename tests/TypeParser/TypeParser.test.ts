import { parsePhpType } from "../../src/TypeParser/typeParser"
import { dump } from "../../src/helpers"


test('Test parsing of PHP-like type hints: Basics', () => {

	expect(parsePhpType('ahoj')).toEqual({
		name: 'ahoj',
		repr: 'ahoj',
		iteratesAs: null,
	})

	expect(parsePhpType('ahoj<chuligane>')).toEqual({
		name: 'ahoj',
		repr: 'ahoj<chuligane>',
		// We don't know any in-PHP-world-well-known type "ahoj" with a generic
		// form we know what it iterates as.
		iteratesAs: null,
	})

	expect(parsePhpType('\\MyNamespace\\MyClass')).toEqual({
		name: '\\MyNamespace\\MyClass',
		repr: '\\MyNamespace\\MyClass',
		iteratesAs: null,
	})

})

const WELL_KNOWN_ITERABLES = [
	'array',
	'iterable',
	'\\Iterator',
	'\\IteratorAggregate',
	'\\Traversable',
	'\\Generator',
]

for (const wellKnownIterable of WELL_KNOWN_ITERABLES) {
	test(`Test parsing of PHP-like type hints: Basic iterable: ${wellKnownIterable}<V>`, () => {

		expect(parsePhpType(`${wellKnownIterable}<chuligane>`)).toEqual({
			name: `${wellKnownIterable}`,
			repr: `${wellKnownIterable}<chuligane>`,
			iteratesAs: {
				value: {
					name: 'chuligane',
					repr: 'chuligane',
					iteratesAs: null,
				}
			},
		})

	})
}


for (const wellKnownIterable of WELL_KNOWN_ITERABLES) {
	test(`Test parsing of PHP-like type hints: Basic iterable: ${wellKnownIterable}<K, V>`, () => {

		expect(parsePhpType(`${wellKnownIterable}<string, chuligane>`)).toEqual({
			name: `${wellKnownIterable}`,
			repr: `${wellKnownIterable}<string, chuligane>`,
			iteratesAs: {
				key: {
					name: 'string',
					repr: 'string',
					iteratesAs: null,
				},
				value: {
					name: 'chuligane',
					repr: 'chuligane',
					iteratesAs: null,
				}
			},
		})

	})
}