/**
 * JS equivalent of Python's defaultdict.
 */
export class DefaultMap<K, V> extends Map<K, V> {
	private defaultBuilder: () => V

	constructor(defaultBuilder: () => V, ...args: any) {
		super(...args)
		this.defaultBuilder = defaultBuilder
	}

	public get(key: K): V {
		if (!super.has(key)) {
			super.set(key, this.defaultBuilder())
		}
		return super.get(key)!
	}
}
