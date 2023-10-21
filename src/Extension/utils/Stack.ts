export default class Stack<T> {
	stack: T[]

	constructor() {
		this.stack = []
	}

	public getSize(): number {
		return this.stack.length
	}

	public push(item: T): void {
		this.stack.push(item)
	}

	public pop(): T | undefined {
		return this.stack.pop() ?? undefined
	}

	public getTop(deeper: number = 0): T | undefined {
		return this.stack[this.stack.length - 1 - deeper] ?? undefined
	}

	public clear(): void {
		this.stack = []
	}
}
