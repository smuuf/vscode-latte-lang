import { mkdir, readFile, writeFileSync } from 'fs'
import { PhpClassInfo } from '../types.phpEntities'
import util from 'util'
import { dirname } from 'path'
import { debugLog } from './common'

const readFilePromise = util.promisify(readFile)
const mkdirPromise = util.promisify(mkdir)

export class DataStorage {
	private data: {
		classes: Record<string, PhpClassInfo>
	}
	private loaded: boolean = false

	constructor(private dbFilePath: string) {
		debugLog(`DataStorage created with path ${dbFilePath}`)
		this.data = {
			classes: {},
		}
	}

	public async loadDatabase(): VoidPromise {
		if (this.loaded) {
			return
		}

		try {
			await mkdirPromise(dirname(this.dbFilePath), { recursive: true })
			const buffer = await readFilePromise(this.dbFilePath)
			this.data = buffer.byteLength ? JSON.parse(buffer.toString()) : this.data
		} catch (e) {
			debugLog(e)
			// Keep original "empty" data on any error.
		}

		this.loaded = true
	}

	public persistDatabase(): void {
		// NOTE: It seems that async FS functions don't work during extension
		// deactivation, which is when this is supposed to be called.
		// At least on my machine. ¯\_(ツ)_/¯
		// Maybe this is related to:
		// https://github.com/microsoft/vscode/issues/144118
		const serializedData = JSON.stringify(this.data)
		writeFileSync(this.dbFilePath, serializedData, 'utf-8')
	}

	public storeClassInfo(classInfo: PhpClassInfo): void {
		this.data.classes[classInfo.fqn] = classInfo
	}

	public fetchAllClassInfos(): { [fqn: string]: PhpClassInfo } {
		return this.data.classes
	}
}
