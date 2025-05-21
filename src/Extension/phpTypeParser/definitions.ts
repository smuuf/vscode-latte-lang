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
	'list', // A fake type, but accepted by wider community.
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
