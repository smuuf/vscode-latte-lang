import * as vscode from "vscode"

export interface Position {
	offset: number
	line: number | null
	character: number | null
}

export type PhpMethodInfo = {
	name: string
	position: Position
}

export type PhpClassInfo = {
	name: string
	namespace: string
	fqn: string
	location: {
		uri: vscode.Uri | null
		position: Position
	}
	methods: PhpMethodInfo[]
}

// Export for testing.
export type BalancedCaptureResult = {
	content: string
	offset: number // Start index of the content inside the original input string.
}

export type ParsingContext = {
	namespace: string
	incompletePositions: Position[]
	uri: vscode.Uri | null
}
