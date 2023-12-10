import * as vscode from 'vscode'
import { ExtensionCore } from './Extension/ExtensionCore'
import { DataStorage } from './Extension/utils/DataStorage'

let extCore: ExtensionCore | null
let dataStorage: DataStorage | null

async function prepareDataStorage(storageDir: string | null): Promise<DataStorage> {
	const ds = new DataStorage(`${storageDir}/latte-ext-data.db`)
	await ds.loadDatabase()
	return ds
}

export async function activate(ctx: vscode.ExtensionContext): VoidPromise {
	dataStorage = await prepareDataStorage(ctx.storageUri?.fsPath ?? null)
	extCore = new ExtensionCore(ctx, dataStorage)
	extCore.registerDisposables()
}

export async function deactivate(ctx: vscode.ExtensionContext): VoidPromise {
	dataStorage?.persistDatabase()
}
