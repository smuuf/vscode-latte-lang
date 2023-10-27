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
		uri: vscode.Uri
		offset: integer
	} | null
	methods: PhpClassMethods | null
}

export type ParsingContext = {
	namespace: string
	uri: vscode.Uri | null
}
