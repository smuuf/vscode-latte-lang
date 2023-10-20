import * as vscode from 'vscode'

import { ExtensionCore } from './Extension/Core'

export async function activate(ctx: vscode.ExtensionContext): VoidPromise {
	const extCore = new ExtensionCore(ctx)
	extCore.registerDisposables()
}
