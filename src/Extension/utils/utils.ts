import { KeyObject } from 'crypto'

/**
 * Returns true if the first argument A has "instanceof B" evaluated as true
 * with any of the Bs passed as the rest of the arguments.
 */
export function isInstanceOf(subject: object, ...types: any[]): boolean {
	return types.some((type) => subject instanceof type)
}

export function isString(subject: any): boolean {
	return typeof subject === 'string' || subject instanceof String
}

/**
 * Makes TS think/know the subject is now of type T.
 */
export function narrowType<T>(subject: any): asserts subject is T {}

/**
 * Takes an iterable containing strings and returns a sum of their lengths.
 */
export function sumStringLength<T>(items: Iterable<string>): integer {
	return [...items].reduce((acc: integer, cur: string): integer => cur.length, 0)
}

export function dump(thing: any): void {
	console.dir(thing, { depth: 10 })
}

export function filterMap<K, V>(
	map: Map<K, V>,
	predicate: (k: K, v: V) => boolean,
): Map<K, V> {
	return new Map([...map].filter((item) => predicate(...item)))
}

export function mapMap<K, V, RV>(map: Map<K, V>, fn: (k: K, v: V) => RV): Map<K, RV> {
	return new Map(Array.from(map, ([key, value]) => [key, fn(key, value)]))
}
