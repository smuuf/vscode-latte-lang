import * as vscode from 'vscode'

import { ExtensionCore } from './Extension/ExtensionCore'

export async function activate(ctx: vscode.ExtensionContext): VoidPromise {
	const extCore = new ExtensionCore(ctx)
	extCore.registerDisposables()
}
