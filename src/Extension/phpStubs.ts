import json5 from 'json5'
import vscode from 'vscode'
import path from 'path'
import fs from 'fs'
import { PhpFunctionInfo } from './types.phpEntities'
import { parsePhpTypeCached } from './phpTypeParser/phpTypeParser'
import { narrowType } from './utils/common'

// PHP stubs file path within the extension.
const STUB_FILE_PATHS = [
	'./php-stubs/php-stubs.json',
	'./php-stubs/php-stubs.constructs.json',
]

type LoadedStubValue = { rtype: string; raw: boolean } | PhpFunctionInfo
type LoadedStubsMap = Map<string, LoadedStubValue>

var loadedStubs: boolean | LoadedStubsMap = false
var extensionCtx: null | vscode.ExtensionContext = null

export function initExtensionContext(ctx: vscode.ExtensionContext) {
	extensionCtx = ctx
}

export function getFunctionInfoFromStubs(fnName: string): PhpFunctionInfo | null {
	if (loadedStubs === false) {
		readStubFiles()
	}

	narrowType<LoadedStubsMap>(loadedStubs)
	let result = loadedStubs.get(fnName)
	if (result && 'raw' in result) {
		result = {
			name: fnName,
			returnType: parsePhpTypeCached(result.rtype),
		}
		loadedStubs.set(fnName, result)
	}

	return result ?? null
}

function readStubFiles(): void {
	if (!extensionCtx) {
		throw Error('Extension context is not initialized')
	}

	loadedStubs = new Map()
	for (const filepath of STUB_FILE_PATHS) {
		readStubFile(path.join(extensionCtx.asAbsolutePath(filepath)))
	}
}

function readStubFile(filepath: string): void {
	const jsonStr = fs.readFileSync(filepath, 'utf8')
	const jsonData = json5.parse(jsonStr) as object

	narrowType<LoadedStubsMap>(loadedStubs)
	for (const [fnName, info] of Object.entries(jsonData)) {
		// NOTE: We're flagging raw data in the map, so we know we want to
		// update it into real PhpFunctionInfo upon fetching.
		loadedStubs.set(fnName, { ...info, raw: true })
	}
}
