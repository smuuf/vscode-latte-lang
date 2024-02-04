import * as vscode from 'vscode'
import { statusBarSpinMessage, uriFileExists } from '../utils/common.vscode'
import { parsePhpSource } from '../phpParser/parser'
import { PhpClassInfo } from '../phpParser/types'
import { ExtensionCore } from '../ExtensionCore'
import { FILE_EXT_PHP, LANG_ID_PHP } from '../../constants'
import { PhpClass } from './PhpClass'
import { debugLog, isObjectEmpty } from '../utils/common'
import { timeit } from '../utils/timeit'

type ClassMapType = { [fqn: phpClassFqn]: PhpClassInfo }

export class PhpWorkspaceInfoProvider {
	classMap: ClassMapType
	classInfoProviderCallback: (classFqn: string) => Promise<PhpClassInfo | null>

	public constructor(private extCore: ExtensionCore) {
		this.classMap = extCore.dataStorage.fetchAllClassInfos() || {}

		this.classInfoProviderCallback = (classFqn: string) =>
			this.getPhpClassInfo(classFqn)

		// If we haven't got cached data from data storage, we start scanning
		// PHP files almost immediately (but let's wait a bit, to avoid clogging
		// vscode which might be starting other extensions too).
		// If we've got some cached data, wait even longer.
		const scanStartTimeout = isObjectEmpty(this.classMap) ? 1000 : 10_000
		setTimeout(() => this.scanWorkspace(), scanStartTimeout)

		// Register file-change events.
		const workspaceEvents = extCore.workspaceEvents
		workspaceEvents.addDocumentSaveHandler(async (doc: TextDoc) => {
			await this.scanPhpFile(doc.uri)
		}, LANG_ID_PHP)
		workspaceEvents.addUriChangeHandler(async (uri: vscode.Uri) => {
			await this.scanPhpFile(uri)
		}, FILE_EXT_PHP)
		workspaceEvents.addUriCreateHandler(async (uri: vscode.Uri) => {
			await this.scanPhpFile(uri)
		}, FILE_EXT_PHP)
		// NOTE: We don't "forget" PHP files here, because we handle forgetting
		// stuff from PHP files elsewhere - if someone requests info for a class
		// which is supposed to be in some PHP file + we discover the file does
		// not exist, we just forget the class.
	}

	public async getPhpClass(className: string | null): Promise<PhpClass | null> {
		if (!className) {
			return null
		}

		const classInfo = await this.getPhpClassInfo(className)
		return classInfo ? new PhpClass(classInfo, this.classInfoProviderCallback) : null
	}

	public async getPhpClassInfo(className: string): Promise<PhpClassInfo | null> {
		const classInfo = this.classMap[className] || null
		if (!classInfo) {
			return null
		}

		if (
			classInfo.location?.uri &&
			!(await uriFileExists(vscode.Uri.parse(classInfo.location.uri)))
		) {
			// We know about a class with this name but the file it's supposed
			// to be in no longer exists. Forges the class.
			delete this.classMap[className]
			return null
		}

		return classInfo
	}

	private async scanPhpFile(uri: vscode.Uri): VoidPromise {
		const bytes = await vscode.workspace.fs.readFile(uri)
		const fileData = await parsePhpSource(bytes.toString(), uri.fsPath)

		Object.values(fileData.classes).forEach((cls: PhpClassInfo) => {
			this.classMap[cls.fqn] = cls
			this.extCore.dataStorage.storeClassInfo(cls)
		})
	}

	private async scanWorkspace(): VoidPromise {
		let msg: vscode.Disposable = statusBarSpinMessage(
			'Finding PHP files in workspace',
			30,
		)
		const allFiles = await timeit('scanWorkspace()', async () => {
			return vscode.workspace.findFiles(
				new vscode.RelativePattern(
					vscode.workspace.workspaceFolders![0],
					'**/*.php',
				),
				'**/{node_modules,.git}/**',
			)
		})
		msg.dispose()
		debugLog(`scanWorkspace(): Found ${allFiles.length} PHP files`)

		const outsideVendor: vscode.Uri[] = []
		const insideVendor: vscode.Uri[] = []
		allFiles.map((uri: vscode.Uri) => {
			uri.fsPath.indexOf('/vendor/') === -1
				? outsideVendor.push(uri)
				: insideVendor.push(uri)
		})

		const totalFilesCount = outsideVendor.length + insideVendor.length
		msg = statusBarSpinMessage(`Scanning ${totalFilesCount} PHP files`, 30)
		await timeit('scanWorkspaceFiles() outside vendor dir', async () => {
			await this.scanWorkspaceFiles(outsideVendor)
		})
		await timeit('scanWorkspaceFiles() inside vendor dir', async () => {
			await this.scanWorkspaceFiles(insideVendor)
		})
		msg.dispose()
	}

	private async scanWorkspaceFiles(uris: vscode.Uri[]) {
		while (uris.length) {
			const urisBatch = uris.splice(0, 600)
			const promises = urisBatch.map(async (uri) => this.scanPhpFile(uri))
			await Promise.all(promises)
		}
	}
}
