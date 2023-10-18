export default class RuntimeCache<K, V> {
	cache = new Map<K, V>()

	public set(k: K, v: V): void {
		this.cache.set(k, v)
	}

	public get(k: K): V | undefined {
		return this.cache.get(k)
	}

	public delete(k: K): void {
		this.cache.delete(k)
	}

	public isEmpty(): boolean {
		return this.cache.size === 0
	}
}
