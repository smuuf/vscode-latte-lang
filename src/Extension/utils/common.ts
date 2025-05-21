const devMode = process.env.NODE_ENV === 'development'

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

export function isObject(obj: any): boolean {
	return obj != null && obj.constructor.name === 'Object'
}

export function isObjectEmpty(object: object | Record<string, unknown>): boolean {
	// If any enumerable property is found object is not empty
	for (const _ in object) {
		return false
	}
	return true
}

/**
 * Makes TS think/know the subject is now of type T.
 */
export function narrowType<T>(subject: any): asserts subject is T {}

export function dump(thing: any): void {
	console.dir(thing, { depth: 10 })
}

export function debugLog(...things: any): void {
	if (devMode) {
		console.log('[latte-ext]', ...things)
	}
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

export function mapSet<V, RV>(set: Set<V>, fn: (v: V) => RV): Set<RV> {
	return new Set(Array.from(set, (v) => fn(v)))
}
