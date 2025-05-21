import { debugLog } from './common'

export async function timeit<RV>(
	name: string,
	fn: (...args: any[]) => Promise<RV>,
): Promise<RV> {
	let start = performance.now()
	const result = await fn()
	let duration = performance.now() - start

	debugLog(name, `took ${duration / 1_000} s`)
	return Promise.resolve(result)
}

export function timeitSync<RV>(name: string, fn: (...args: any[]) => RV): RV {
	let start = performance.now()
	const result = fn()
	let duration = performance.now() - start

	debugLog(name, `took ${duration / 1_000} s`)
	return result
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getUnixTimestamp(): number {
	return Math.floor(Date.now() / 1000)
}
