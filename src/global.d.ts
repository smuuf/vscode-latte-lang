import * as vscode from 'vscode'

declare global {
	type VoidPromise = Promise<void> // To avoid Promise<Void> everywhere.
	type TextDoc = vscode.TextDocument // To avoid these everywhere.

	type integer = number // Semantics, people.
	type filePath = string
	type phpClassFqn = string // PHP class fully qualified name.
	type variableName = string // PHP/Latte variable name.
}
