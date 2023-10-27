import * as vscode from 'vscode'
import { statusBarMessage } from './utils/common.vscode'
import { parsePhp } from './DumbPhpParser/parser'
import { PhpClassInfo } from './DumbPhpParser/types'
import { ExtensionCore } from './ExtensionCore'
import { DefaultMap } from './utils/DefaultMap'
import { LANG_ID_PHP } from '../langIds'

class PhpWorkspaceInfo {
	// Yes, there can be multiple same-fully-qualified PHP class names in the
	// same workspace that are in different PHP files, but that's their problem
	// and I don't care. We'll store only one class info per one fully qualified
	// PHP class name.
	public classMap: Map<phpClassFqn, PhpClassInfo>
	public fileMap

	public constructor() {
		this.classMap = new Map()
		this.fileMap = new DefaultMap<filePath, Set<phpClassFqn>>(
			() => new Set<phpClassFqn>(),
		)
	}
}

export class PhpWorkspaceInfoProvider {
	workspaceInfo: PhpWorkspaceInfo

	public constructor(extCore: ExtensionCore) {
		this.workspaceInfo = new PhpWorkspaceInfo()

		if (!this.workspaceInfo.classMap.size) {
			this.scanWorkspace()
		}

		// Register file-change events.
		const workspaceEvents = extCore.workspaceEvents
		workspaceEvents.addDocumentSaveHandler(async (doc: vscode.TextDocument) => {
			await this.forgetAndRescanPhpDocument(doc)
		}, LANG_ID_PHP)
	}

	private async scanPhpFile(uri: vscode.Uri): VoidPromise {
		const bytes = await vscode.workspace.fs.readFile(uri)
		const classes = await parsePhp(bytes.toString(), uri)
		classes.forEach((cls: PhpClassInfo) => {
			this.workspaceInfo.classMap.set(cls.fqn, cls)
			this.workspaceInfo.fileMap.get(uri.path).add(cls.fqn)
		})
	}

	private async scanWorkspace(): VoidPromise {
		let msg: vscode.Disposable | null = statusBarMessage(
			'$(sync~spin) Scanning workspace for PHP files',
		)
		const phpFilesUris = await vscode.workspace.findFiles(
			'**/*.php',
			'**/{node_modules,temp,log,vendor}/**',
		)
		msg.dispose()

		phpFilesUris.forEach(async (uri) => {
			await this.scanPhpFile(uri)
		})
	}

	public async getClassInfo(className: string): Promise<PhpClassInfo | null> {
		return this.workspaceInfo.classMap.get(className) || null
	}

	public async forgetAndRescanPhpDocument(doc: TextDoc): VoidPromise {
		const docPath = doc.uri.path
		const workspaceInfo = this.workspaceInfo

		// If we don't know about this file, don't do anything.
		if (workspaceInfo.fileMap.has(docPath)) {
			// If we know about this file, go through each of the PHP classes
			// we know it contains and then delete this file's reference in our
			// class map (where we store link between the PHP class name and
			// the locations/files we know they're defined).
			const classes = workspaceInfo.fileMap.get(docPath)
			classes.forEach((classFqn: phpClassFqn) => {
				if (
					workspaceInfo.classMap.get(classFqn)?.location?.uri.path === docPath
				) {
					workspaceInfo.classMap.delete(classFqn)
				}
			})

			// And don't forget to forget the PHP file itself.
			workspaceInfo.fileMap.delete(docPath)
		}

		await this.scanPhpFile(doc.uri)
	}
}
