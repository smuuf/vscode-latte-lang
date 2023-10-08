import * as vscode from "vscode"
import config from "./config"

/**
 * Returns true if the first argument A has "instanceof B" evaluated as true
 * with any of the Bs passed as the rest of the arguments.
 */
export function isInstanceOf(subject: object, ...types: any[]): boolean {
	return types.some((type) => subject instanceof type)
}

/**
 * Makes TS think/know the subject is now of type T.
 */
export function narrowType<T>(subject: any): asserts subject is T {}

const debugMessage = config.debugging
	? (text: string): any => vscode.window.setStatusBarMessage(text, 5_000)
	: () => {}

export {
	debugMessage
}