export default class Stack<T> {
	stack: T[]

	constructor() {
		this.stack = []
	}

	size(): number {
		return this.stack.length
	}

	push(item: T): void {
		this.stack.push(item)
	}

	pop(): T | undefined {
		return this.stack.pop() ?? undefined
	}

	top(deeper: number = 0): T | undefined {
		return this.stack[this.stack.length - 1 - deeper] ?? undefined
	}

	clear(): void {
		this.stack = []
	}
}