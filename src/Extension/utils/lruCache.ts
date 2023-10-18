import { KeyedCircularBuffer } from "./KeyedCircularBuffer"



export function lruCache(fn: CallableFunction, maxSize = 200) {
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
