import * as vscode from 'vscode'

import { ExtensionCore } from './Extension/ExtensionCore'

let extCore: ExtensionCore | null

export async function activate(ctx: vscode.ExtensionContext): VoidPromise {
	extCore = new ExtensionCore(ctx)
	extCore.registerDisposables()
}

export async function deactivate(ctx: vscode.ExtensionContext): VoidPromise {
	if (!extCore) {
		return
	}
}
