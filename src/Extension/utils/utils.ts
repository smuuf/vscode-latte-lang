/**
 * Returns true if the first argument A has "instanceof B" evaluated as true
 * with any of the Bs passed as the rest of the arguments.
 */
export function isInstanceOf(subject: object, ...types: any[]): boolean {
	return types.some((type) => subject instanceof type)
}

export function isString(subject: any): boolean {
	return typeof(subject) === 'string' || subject instanceof String
}

/**
 * Makes TS think/know the subject is now of type T.
 */
export function narrowType<T>(subject: any): asserts subject is T {}


export function dump(thing: any): void {
	console.dir(thing, {depth: 10})
}
