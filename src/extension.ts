import * as vscode from 'vscode'

import { dump } from './Extension/utils/utils'
import { parsePhp } from './Extension/PhpParser/parser'
import { ExtensionCore } from './Extension/Core'


export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
	const extCore = new ExtensionCore(ctx)
	extCore.registerDisposables()

	// const files = await vscode.workspace.findFiles('**/*.php', '**/{node_modules,temp,log,vendor}/**')
	// console.log(files)

	// var watcher = vscode.workspace.createFileSystemWatcher("*.ts"); //glob search string
	// watcher.ignoreChangeEvents = false

	// watcher.onDidChange(() => {
	//  vscode.window.showInformationMessage("change applied!"); //In my opinion this should be called
	// })

	const uri: vscode.Uri = vscode.Uri.file('/mnt/d/produkce/www/artiview/php/app/Model/Entities/Artifact.php')
	const buf = await vscode.workspace.fs.readFile(uri)
	const strBuf = buf.toString()
	dump(parsePhp(strBuf))

}
