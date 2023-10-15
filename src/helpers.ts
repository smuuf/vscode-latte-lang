/**
 * Returns true if the first argument A has "instanceof B" evaluated as true
 * with any of the Bs passed as the rest of the arguments.
 */
export function isInstanceOf(subject: object, ...types: any[]): boolean {
	return types.some((type) => subject instanceof type)
}

export function isString(subject: any): boolean {
	return typeof(subject) === 'string' || subject instanceof String;
}

/**
 * Makes TS think/know the subject is now of type T.
 */
export function narrowType<T>(subject: any): asserts subject is T {}


export function lruCache(fn: CallableFunction, maxSize=200) {
	const buffer = new KeyedCircularBuffer<string, any>(maxSize)

	return (...args: any[]) => {
		const key: string = JSON.stringify(args)

		if (buffer.has(key)) {
			return buffer.get(key)
		}

		const result = fn(...args)
		buffer.set(key, result)

		return result
	}
}


export class KeyedCircularBuffer<K, V> {
	size: number
	items: Map<K, V>

	constructor(size: number) {
		this.size = Math.round(size)
		if (this.size < 1) {
			throw Error("KeyedCircularBuffer size must be greater than 1")
		}

		this.items = new Map()
	}

	set(key: K, value: V): void {
		this.items.set(key, value)
		if (this.items.size > this.size) {
			this.items.delete(this.firstKey)
		}
	}

	get(key: K): V | undefined {
		return this.items.get(key)
	}

	has(key: K): boolean {
		return this.items.has(key)
	}

	private get firstKey(): K {
		return this.items.keys().next().value
	}
}

export function dump(thing: any): void {
	console.dir(thing, {depth: 10})
}