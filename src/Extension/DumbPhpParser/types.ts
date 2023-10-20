import * as vscode from 'vscode'

export type PhpMethodInfo = {
	name: string
	offset: integer
}

export type PhpClassMethods = Map<string, PhpMethodInfo>

export type PhpClassInfo = {
	name: string
	namespace: string

	fqn: string
	location: {
		uri: vscode.Uri | null
		offset: integer
	}
	methods: PhpClassMethods | null
}

// Export for testing.
export type BalancedCaptureResult = {
	content: string
	offset: integer // Start index of the content inside the original input string.
}

export type ParsingContext = {
	namespace: string
	uri: vscode.Uri | null
}
