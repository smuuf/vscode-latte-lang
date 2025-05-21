import * as vscode from 'vscode'
import { ExtensionCore } from './Extension/ExtensionCore'
import { DataStorage } from './Extension/utils/DataStorage'
import { timeit } from './Extension/utils/timeit'
import { initExtensionContext } from './Extension/phpStubs'

let extCore: ExtensionCore | null
let dataStorage: DataStorage | null

async function prepareDataStorage(
	storageDir: string | null,
	skipLoad: boolean,
): Promise<DataStorage> {
	const ds = new DataStorage(`${storageDir}/latte-ext-data.db`)

	if (!skipLoad) {
		await timeit('loadDatabase', async () => ds.loadDatabase())
	}

	return ds
}

export async function activate(ctx: vscode.ExtensionContext): VoidPromise {
	const currentVersion: string = ctx.extension.packageJSON.version
	const lastVersion = ctx.workspaceState.get<string>('version')

	initExtensionContext(ctx)

	// Discard whatever was in the data storage if we're witnessing
	// a first activation since this extension's update.
	const resetDataStorage = currentVersion !== lastVersion
	dataStorage = await prepareDataStorage(
		ctx.storageUri?.fsPath ?? null,
		resetDataStorage,
	)

	extCore = new ExtensionCore(ctx, dataStorage)
	extCore.registerDisposables()

	ctx.workspaceState.update('version', currentVersion)
}

export async function deactivate(ctx: vscode.ExtensionContext): VoidPromise {
	dataStorage?.persistDatabase()
}
