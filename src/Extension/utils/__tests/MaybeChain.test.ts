import { MaybeChain } from '../MaybeChain'

test('MaybeChain', () => {
	let result: any = undefined

	result = new MaybeChain<number>(() => 1)
		.then((x) => {
			return x + 1
		})
		.then(() => null)
		.then(() => 3)
		.resolve()
	expect(result).toBeNull()

	result = new MaybeChain<number>(() => 1)
		.then((x) => {
			return x + 2
		})
		.then(() => undefined)
		.then(() => 4)
		.resolve()
	expect(result).toBeNull()

	result = new MaybeChain<number>(() => 1)
		.then((x) => {
			return x + 1
		})
		.then(() => 3)
		.resolve()
	expect(result).toBe(3)
})
