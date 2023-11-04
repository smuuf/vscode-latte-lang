import * as vscode from 'vscode'
import path from 'path'

type DocEventHandler = (doc: TextDoc) => VoidPromise
type DocEventHandlersList = [DocEventHandler, string | null][]

type UriEventHandler = (uri: vscode.Uri) => VoidPromise
type UriEventHandlersList = [UriEventHandler, string | null][]

export class WorkspaceEvents {
	private onDocumentChangeHandlers: DocEventHandlersList = []
	private onDocumentSaveHandlers: DocEventHandlersList = []
	private onDocumentCloseHandlers: DocEventHandlersList = []
	private onUriCreateHandlers: UriEventHandlersList = []
	private onUriChangeHandlers: UriEventHandlersList = []
	private onUriDeleteHandlers: UriEventHandlersList = []

	//
	// Vscode TextDocument events.
	//

	private async fireDocumentEvent(doc: TextDoc, handlers: DocEventHandlersList) {
		await Promise.all(
			handlers.map(async ([handler, langId]) => {
				if (langId && doc.languageId !== langId) {
					return
				}

				return handler(doc)
			}),
		)
	}

	public async fireDocumentChange(doc: TextDoc) {
		await this.fireDocumentEvent(doc, this.onDocumentChangeHandlers)
	}

	public async fireDocumentSave(doc: TextDoc) {
		await this.fireDocumentEvent(doc, this.onDocumentSaveHandlers)
	}

	public async fireDocumentClose(doc: TextDoc) {
		await this.fireDocumentEvent(doc, this.onDocumentCloseHandlers)
	}

	public addDocumentChangeHandler(
		h: DocEventHandler,
		langId: string | null = null,
	): void {
		this.onDocumentChangeHandlers.push([h, langId])
	}

	public addDocumentSaveHandler(
		h: DocEventHandler,
		langId: string | null = null,
	): void {
		this.onDocumentSaveHandlers.push([h, langId])
	}

	public addDocumentCloseHandler(
		h: DocEventHandler,
		langId: string | null = null,
	): void {
		this.onDocumentCloseHandlers.push([h, langId])
	}

	//
	// Filesystem (URI) events.
	//

	private async fireUriEvent(uri: vscode.Uri, handlers: UriEventHandlersList) {
		const uriExt = path.parse(uri.fsPath).ext

		await Promise.all(
			handlers.map(([handler, ext]) => {
				if (ext && uriExt !== ext) {
					return
				}

				return handler(uri)
			}),
		)
	}

	public async fireUriCreate(uri: vscode.Uri) {
		await this.fireUriEvent(uri, this.onUriCreateHandlers)
	}

	public async fireUriChange(uri: vscode.Uri) {
		await this.fireUriEvent(uri, this.onUriChangeHandlers)
	}

	public async fireUriDelete(uri: vscode.Uri) {
		await this.fireUriEvent(uri, this.onUriDeleteHandlers)
	}

	public addUriCreateHandler(h: UriEventHandler, ext: string | null = null): void {
		this.onUriCreateHandlers.push([h, ext])
	}

	public addUriChangeHandler(h: UriEventHandler, ext: string | null = null): void {
		this.onUriChangeHandlers.push([h, ext])
	}

	public addUriDeleteHandler(h: UriEventHandler, ext: string | null = null): void {
		this.onUriDeleteHandlers.push([h, ext])
	}
}
