import { lruCache } from '../src/Extension/utils/lruCache'

test('lruCache', () => {
	const fired: any[] = []
	const fn = lruCache((arg) => fired.push(arg), 5)

	expect(fired).toEqual([])
	fn(1)
	expect(fired).toEqual([1])
	fn(2)
	expect(fired).toEqual([1, 2])
	fn(1) // Again.
	expect(fired).toEqual([1, 2])
	fn(3)
	expect(fired).toEqual([1, 2, 3])
	fn(4)
	expect(fired).toEqual([1, 2, 3, 4])
	fn(2) // Again.
	expect(fired).toEqual([1, 2, 3, 4])
	fn(500)
	expect(fired).toEqual([1, 2, 3, 4, 500])
	fn(2) // Again.
	expect(fired).toEqual([1, 2, 3, 4, 500])
	fn(400)
	expect(fired).toEqual([1, 2, 3, 4, 500, 400])

	// Cache size was reached, so...
	// 1 was dropped from cache, so it will be fired again.
	fn(1)
	expect(fired).toEqual([1, 2, 3, 4, 500, 400, 1])

	// 3 is still in cache, so it won't be fired again.
	fn(3)
	expect(fired).toEqual([1, 2, 3, 4, 500, 400, 1])

	// 2 has been dropped, so it will be fired again.
	fn(2)
	expect(fired).toEqual([1, 2, 3, 4, 500, 400, 1, 2])

	// ... and because of that 3 has now been dropped, so will be fired again.
	fn(3)
	expect(fired).toEqual([1, 2, 3, 4, 500, 400, 1, 2, 3])
})
