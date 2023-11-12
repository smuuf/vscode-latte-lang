type AnyFunction = (...args: any[]) => any

export class MaybeChain<RV> {
	private chain: AnyFunction[]

	public constructor(fn: AnyFunction) {
		this.chain = []
		this.chain.push(fn)
	}

	public then(fn: AnyFunction): this {
		this.chain.push(fn)
		return this
	}

	public resolve(): RV | null {
		let retval = null
		for (const fn of this.chain) {
			retval = fn(retval)
			if (retval === null || retval === undefined) {
				return null
			}
		}

		return retval
	}
}
