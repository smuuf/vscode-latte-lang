import * as vscode from 'vscode'
import { ExtensionCore } from '../ExtensionCore'

export enum PoiType {
	Hover,
	GotoDefinition,
}

export interface AbstractPoi {
	type: PoiType
	range: [integer, integer]
}

export interface HoverPoi extends AbstractPoi {
	type: PoiType.Hover
	contentFn: (
		doc: TextDoc,
		position: vscode.Position,
		extCore: ExtensionCore,
	) => Promise<string | vscode.MarkdownString>
}

export interface GotoDefinitionPoi extends AbstractPoi {
	type: PoiType.GotoDefinition
	contentFn: (
		doc: TextDoc,
		position: vscode.Position,
		extCore: ExtensionCore,
	) => Promise<vscode.Location | vscode.LocationLink[] | null>
}
