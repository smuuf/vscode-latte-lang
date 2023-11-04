import * as vscode from 'vscode'
import { PhpType } from '../phpTypeParser/phpTypeParser'

export type PhpMethodInfo = {
	name: string
	offset: integer
	flags: PhpMethodFlags
	returnType?: PhpType | null
}

export type PhpMethodFlags = {
	visibility: SymbolVisibility
	static: boolean
}

export type PhpClassMethods = Map<string, PhpMethodInfo>

export type PhpClassInfo = {
	name: string
	namespace: string
	parentFqn: string | null
	fqn: string
	location: {
		uri: vscode.Uri
		offset: integer
	} | null
	methods: PhpClassMethods
}

export type ParsingContext = {
	namespace: string
	uri: vscode.Uri | null
	imports: Map<string, string>
}

export enum SymbolVisibility {
	PUBLIC = 'public',
	PROTECTED = 'protected',
	PRIVATE = 'private',
}
