import { KeyedCircularBuffer } from './KeyedCircularBuffer'

export function lruCache<F extends (...args: any[]) => any>(
	fn: F,
	maxSize = 200,
	onlyIf: null | ((...args: any[]) => boolean) = null,
): F {
	const buffer = new KeyedCircularBuffer<string, any>(maxSize)

	return <F>function (...args: any[]) {
		// If "onlyIf" predicate is specified, don't use caching if the
		// predicate doesn't return true.
		if (onlyIf && !onlyIf(...args)) {
			return fn(...args)
		}

		const key: string = JSON.stringify(args)

		if (buffer.has(key)) {
			return buffer.get(key)
		}

		const result = fn(...args)
		buffer.set(key, result)

		return result
	}
}
