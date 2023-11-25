function baseIndentationLevel(input: string): integer {
	const match = input.match(/^[ \t]*(?=\S)/gm)
	return match ? match.reduce((r, a) => Math.min(r, a.length), Infinity) : 0
}

export function stripIndentation(input: string): string {
	// Determine the base indentation - the minimal common indentation for
	// non-empty lines.
	const baseLevel = baseIndentationLevel(input)
	if (!baseLevel) {
		return input
	}

	const regex = new RegExp(`^[ \\t]{${baseLevel}}`, 'gm')
	return input.replace(regex, '')
}
