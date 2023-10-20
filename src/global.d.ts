export {}

declare global {
	type integer = number // Semantics, people.
	type VoidPromise = Promise<void>
}
