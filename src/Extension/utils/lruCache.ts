import { KeyedCircularBuffer } from './KeyedCircularBuffer'

export function lruCache<F extends (...args: any[]) => any>(fn: F, maxSize = 200): F {
	const buffer = new KeyedCircularBuffer<string, any>(maxSize)

	return <F>function (...args: any[]) {
		const key: string = JSON.stringify(args)

		if (buffer.has(key)) {
			return buffer.get(key)
		}

		const result = fn(...args)
		buffer.set(key, result)

		return result
	}
}
