import { KeyedCircularBuffer } from '../src/Extension/utils/KeyedCircularBuffer'

test('Keyed circular buffer', () => {
	const b = new KeyedCircularBuffer(3)

	b.set('a', 1)
	b.set('b', 2)
	b.set('c', 3)

	expect(b.has('a')).toBe(true)
	expect(b.has('b')).toBe(true)
	expect(b.has('c')).toBe(true)
	expect(b.get('a')).toBe(1)
	expect(b.get('b')).toBe(2)
	expect(b.get('c')).toBe(3)

	b.set('d', 4)

	expect(b.has('a')).toBe(false)
	expect(b.has('b')).toBe(true)
	expect(b.has('c')).toBe(true)
	expect(b.has('d')).toBe(true)
	expect(b.get('a')).toBe(undefined)
	expect(b.get('b')).toBe(2)
	expect(b.get('c')).toBe(3)
	expect(b.get('d')).toBe(4)

	b.set('e', 5)

	expect(b.has('a')).toBe(false)
	expect(b.has('b')).toBe(false)
	expect(b.has('c')).toBe(true)
	expect(b.has('d')).toBe(true)
	expect(b.has('e')).toBe(true)
	expect(b.get('a')).toBe(undefined)
	expect(b.get('b')).toBe(undefined)
	expect(b.get('c')).toBe(3)
	expect(b.get('d')).toBe(4)
	expect(b.get('e')).toBe(5)
})
