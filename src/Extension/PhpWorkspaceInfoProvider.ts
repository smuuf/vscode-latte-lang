import * as vscode from 'vscode'
import RuntimeCache from './utils/RuntimeCache'
import { statusBarMessage } from './utils/utils.vscode'
import { parsePhp } from './DumbPhpParser/parser'
import { PhpClassInfo } from './DumbPhpParser/types'

export class PhpWorkspaceInfoProvider {
	cache: RuntimeCache<vscode.TextDocument, any>
	classMap: Map<string, PhpClassInfo>

	public constructor() {
		this.cache = new RuntimeCache()
		this.classMap = new Map()

		if (!this.classMap.size) {
			this.scanWorkspace()
		}
	}

	private async scanWorkspace(): VoidPromise {
		let message = statusBarMessage('$(sync~spin) Scanning workspace for PHP files')

		const phpFiles = await vscode.workspace.findFiles(
			'**/*.php',
			'**/{node_modules,temp,log,vendor}/**',
		)

		message.dispose()
		message = statusBarMessage('$(sync~spin) Scanning class definitions in PHP files')

		// We need to keep track of the original URI of the file so we can
		// tell the parser in which file the classes it finds are.
		const uriThenables = new Map<vscode.Uri, Thenable<Uint8Array>>()
		for await (const uri of phpFiles) {
			uriThenables.set(uri, vscode.workspace.fs.readFile(uri))
		}

		for (const [uri, uriThenable] of uriThenables) {
			const bytes = await uriThenable
			const classes = await parsePhp(bytes.toString(), uri)
			for (const cls of classes) {
				this.classMap.set(cls.fqn, cls)
			}
		}

		message.dispose()
	}
}
