import * as vscode from "vscode"
import config from "../../config"


const debugMessage = config.debugging
	? (msg: string): vscode.Disposable => vscode.window.setStatusBarMessage(msg, 5_000)
	: () => ({ dispose: () => {}}) // Fake disposable


export {
	debugMessage,
}


export function statusBarMessage(msg: string, prefix: string = "Latte"): vscode.Disposable {
	msg = prefix ? `${prefix}: ${msg}` : msg
	return vscode.window.setStatusBarMessage(msg, 20_000)
}


export function infoMessage(msg: string): void {
	vscode.window.showInformationMessage(msg)
}
