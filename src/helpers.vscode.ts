import * as vscode from "vscode"
import config from "./config"

const debugMessage = config.debugging
	? (text: string): vscode.Disposable => vscode.window.setStatusBarMessage(text, 5_000)
	: () => ({ dispose: () => {}}) // Fake disposable

export {
	debugMessage
}