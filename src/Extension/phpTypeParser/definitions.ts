/**
 * See https://www.php.net/manual/en/language.types.type-system.php
 */
export const BUILTIN_TYPES = [
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
	'static',
	'self',
	'list', // Fake type accepted by wider community, but it works here.
]

export const BASIC_ITERABLES = [
	'array',
	'list',
	'iterable',
	'Iterator',
	'IteratorAggregate',
	'Traversable',
	'Generator',
]
