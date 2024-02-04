export interface DocBlockData {
	text: string
	tags: Map<string, string>
}

/**
 * Removes doc-block-style "/** ... \n * ... \n * ..." wrapper from string.
 */
export function cleanDocBlockString(input: string): string {
	input = input
		.trim()
		.replace(/\/\*\*\s*(.*?)\s*\*\//ms, '$1')
		.replace(/^\s*\*\s*/gm, '')
	return input
}

export function parseDocBlockString(input: string): DocBlockData {
	input = cleanDocBlockString(input)

	const result = {
		text: input,
		tags: new Map<string, string>(),
	}

	const tagsMatch = input.matchAll(/^\s*@(?<tag>[^\s]+)\s+(?<args>.*)$/gm)
	for (const m of tagsMatch) {
		result.tags.set(m.groups!['tag'].trim(), m.groups!['args'].trim())
	}

	return result
}
