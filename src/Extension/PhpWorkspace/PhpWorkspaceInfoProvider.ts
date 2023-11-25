import * as vscode from 'vscode'
import { getUriString, statusBarSpinMessage } from '../utils/common.vscode'
import { parsePhpSource } from '../DumbPhpParser/parser'
import { PhpClassInfo } from '../DumbPhpParser/types'
import { ExtensionCore } from '../ExtensionCore'
import { DefaultMap } from '../utils/DefaultMap'
import { FILE_EXT_PHP, LANG_ID_PHP } from '../../constants'
import { PhpClass } from './PhpClass'

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
	classInfoProviderCallback: (classFqn: string) => PhpClassInfo | null

	public constructor(extCore: ExtensionCore) {
		this.workspaceInfo = new PhpWorkspaceInfo()
		this.classInfoProviderCallback = (classFqn: string) =>
			this.getPhpClassInfo(classFqn)

		if (!this.workspaceInfo.classMap.size) {
			this.scanWorkspace()
		}

		// Register file-change events.
		const workspaceEvents = extCore.workspaceEvents
		workspaceEvents.addDocumentSaveHandler(async (doc: TextDoc) => {
			await this.forgetPhpFile(doc.uri)
			await this.scanPhpFile(doc.uri)
		}, LANG_ID_PHP)
		workspaceEvents.addUriChangeHandler(async (uri: vscode.Uri) => {
			await this.forgetPhpFile(uri)
			await this.scanPhpFile(uri)
		}, FILE_EXT_PHP)
		workspaceEvents.addUriCreateHandler(async (uri: vscode.Uri) => {
			await this.scanPhpFile(uri)
		}, FILE_EXT_PHP)
		workspaceEvents.addUriDeleteHandler(async (uri: vscode.Uri) => {
			await this.forgetPhpFile(uri)
		}, FILE_EXT_PHP)
	}

	public getPhpClass(className: string | null): PhpClass | null {
		if (!className) {
			return null
		}

		const classInfo = this.workspaceInfo.classMap.get(className) || null
		return classInfo ? new PhpClass(classInfo, this.classInfoProviderCallback) : null
	}

	public getPhpClassInfo(className: string): PhpClassInfo | null {
		return this.workspaceInfo.classMap.get(className) || null
	}

	private async scanPhpFile(uri: vscode.Uri): VoidPromise {
		const bytes = await vscode.workspace.fs.readFile(uri)
		const classes = await parsePhpSource(bytes.toString(), uri)
		classes.forEach((cls: PhpClassInfo) => {
			this.workspaceInfo.classMap.set(cls.fqn, cls)
			this.workspaceInfo.fileMap.get(getUriString(uri)).add(cls.fqn)
		})
	}

	private async scanWorkspace(): VoidPromise {
		let msg: vscode.Disposable = statusBarSpinMessage(
			'Scanning workspace for PHP files',
		)
		const phpFilesUris = await vscode.workspace.findFiles(
			'**/*.php',
			'**/{node_modules,temp,log,.git}/**',
		)
		msg.dispose()

		let total = phpFilesUris.length
		let count = 0
		do {
			const urisBatch = phpFilesUris.splice(0, 100)
			count += urisBatch.length

			const promises = urisBatch.map(async (uri) => this.scanPhpFile(uri))
			await Promise.all(promises)

			msg.dispose()
			msg = statusBarSpinMessage(`Scanned ${count} of ${total} PHP files`)
		} while (phpFilesUris.length)
		msg.dispose()
	}

	private async forgetPhpFile(uri: vscode.Uri): VoidPromise {
		const uriStr = getUriString(uri)
		const workspaceInfo = this.workspaceInfo

		// If we don't know about this file, don't do anything.
		if (workspaceInfo.fileMap.has(uriStr)) {
			// If we know about this file, go through each of the PHP classes
			// we know it contains and then delete this file's reference in our
			// class map (where we store link between the PHP class name and
			// the locations/files we know they're defined).
			const classes = workspaceInfo.fileMap.get(uriStr)
			classes.forEach((classFqn: phpClassFqn) => {
				if (workspaceInfo.classMap.get(classFqn)?.location?.uri === uriStr) {
					workspaceInfo.classMap.delete(classFqn)
				}
			})

			// And don't forget to forget the PHP file itself.
			workspaceInfo.fileMap.delete(uriStr)
		}

		return this.scanPhpFile(uri)
	}
}
