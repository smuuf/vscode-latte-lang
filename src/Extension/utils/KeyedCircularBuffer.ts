export class KeyedCircularBuffer<K, V> {
	size: number
	items: Map<K, V>

	constructor(size: number) {
		this.size = Math.round(size)
		if (this.size < 1) {
			throw Error('KeyedCircularBuffer size must be greater than 1')
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
