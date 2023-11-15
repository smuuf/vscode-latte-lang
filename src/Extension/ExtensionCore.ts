import * as vscode from 'vscode'

import { LatteFileInfoProvider } from './LatteFileInfoProvider'
import { PhpWorkspaceInfoProvider } from './PhpWorkspace/PhpWorkspaceInfoProvider'
import { GotoDefinitionProviderAggregator } from './VscodeApi/GotoDefinitionProvider'
import { WorkspaceEvents } from './WorkspaceEvents'
import { CompletionProviderAggregator } from './VscodeApi/CompletionProvider'
import { HoverProviderAggregator } from './VscodeApi/HoverProvider'

const LANG_ID = 'latte'

export class ExtensionCore {
	public ctx: vscode.ExtensionContext
	public workspaceEvents: WorkspaceEvents

	public latteFileInfoProvider: LatteFileInfoProvider
	public phpWorkspaceInfoProvider: PhpWorkspaceInfoProvider

	public gotoDefinitionProvider: GotoDefinitionProviderAggregator
	public completionProvider: CompletionProviderAggregator
	public hoverProvider: HoverProviderAggregator

	public onExit: (() => void)[] = []

	public constructor(ctx: vscode.ExtensionContext) {
		this.ctx = ctx
		this.workspaceEvents = new WorkspaceEvents()

		this.latteFileInfoProvider = new LatteFileInfoProvider(this)
		this.phpWorkspaceInfoProvider = new PhpWorkspaceInfoProvider(this)

		this.gotoDefinitionProvider = new GotoDefinitionProviderAggregator(this)
		this.completionProvider = new CompletionProviderAggregator(this)
		this.hoverProvider = new HoverProviderAggregator(this)
	}

	public registerDisposables(): void {
		const providers = [
			vscode.languages.registerHoverProvider(
				LANG_ID,
				new ExtensionHoverProvider(this.hoverProvider),
			),
			vscode.languages.registerDefinitionProvider(
				LANG_ID,
				new ExtensionGoToDefinitionProvider(this.gotoDefinitionProvider),
			),
			vscode.languages.registerCompletionItemProvider(
				LANG_ID,
				new ExtensionCompletionItemProvider(this.completionProvider),
				'$', // For variable name autocompletion.
				'>', // For $object->methodName() completion.
			),
		]

		const documentEvents = [
			vscode.workspace.onDidChangeTextDocument(async (event) => {
				await this.workspaceEvents.fireDocumentChange(event.document)
			}),
			vscode.workspace.onDidCloseTextDocument(async (doc) => {
				await this.workspaceEvents.fireDocumentClose(doc)
			}),
			vscode.workspace.onDidSaveTextDocument(async (doc) => {
				await this.workspaceEvents.fireDocumentSave(doc)
			}),
		]

		const fsWatcher = vscode.workspace.createFileSystemWatcher('**/*.php')
		fsWatcher.onDidCreate(async (uri) => {
			await this.workspaceEvents.fireUriCreate(uri)
		})
		fsWatcher.onDidChange(async (uri) => {
			await this.workspaceEvents.fireUriChange(uri)
		})
		fsWatcher.onDidDelete(async (uri) => {
			await this.workspaceEvents.fireUriDelete(uri)
		})

		// By adding disposables to subscriptions we tell vscode to dispose them
		// on deactivation.
		this.ctx.subscriptions.push(...providers, ...documentEvents, fsWatcher)
	}
}

class ExtensionHoverProvider implements vscode.HoverProvider {
	public constructor(private provider: HoverProviderAggregator) {}

	public async provideHover(
		doc: TextDoc,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<vscode.Hover | null> {
		return this.provider.resolve(doc, position, token)
	}
}

class ExtensionGoToDefinitionProvider implements vscode.DefinitionProvider {
	public constructor(private provider: GotoDefinitionProviderAggregator) {}

	public async provideDefinition(
		doc: TextDoc,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<vscode.Location | vscode.LocationLink[] | null> {
		return this.provider.resolve(doc, position, token)
	}
}

class ExtensionCompletionItemProvider implements vscode.CompletionItemProvider {
	public constructor(private provider: CompletionProviderAggregator) {}

	public async provideCompletionItems(
		doc: TextDoc,
		position: vscode.Position,
		token: vscode.CancellationToken,
	): Promise<vscode.CompletionItem[] | null> {
		return this.provider.resolve(doc, position, token)
	}
}
