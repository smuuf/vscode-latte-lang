type DocEventHandler = (doc: TextDoc) => void
type HandlersList = [DocEventHandler, string | null][]

export class WorkspaceEvents {
	private onDocumentChangeHandlers: HandlersList = []
	private onDocumentSaveHandlers: HandlersList = []
	private onDocumentCloseHandlers: HandlersList = []

	private async fireDocumentEvent(doc: TextDoc, handlers: HandlersList) {
		await handlers.map(async ([handler, langId]) => {
			if (langId && doc.languageId !== langId) {
				return
			}

			await handler(doc)
		})
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
}
