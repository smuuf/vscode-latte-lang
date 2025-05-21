import { isString, narrowType } from './common'

/**
 * Takes an iterable containing strings and returns a sum of their lengths.
 */
export function sumStringLength<T>(items: Iterable<string>): integer {
	return [...items].reduce((acc: integer, cur: string): integer => cur.length, 0)
}

export function wrapString(str: string, beforeAfter: [string, string]): string {
	return `${beforeAfter[0]}${str}${beforeAfter[1]}`
}

/**
 * Try to find a regex match at precisely the specified offset.
 */
export function matchRegexAtIndex(
	regex: string | RegExp,
	subject: string,
	index: integer,
): RegExpExecArray | null {
	// If we got a Regexp object, make our own copy, so the original's object
	// lastIndex is not potentially mutated by us.
	if (!isString(regex)) {
		narrowType<RegExp>(regex)
		regex = regex.source
	}

	// "y" flag makes the regex match precisely at lastIndex.
	// "d" says that we want indices for each match group.
	regex = new RegExp(regex, 'yd')
	regex.lastIndex = index
	return regex.exec(subject)
}

/**
 * Try to find the regex first match from the specified offset.
 */
export function matchRegexFromIndex(
	regex: string | RegExp,
	subject: string,
	index: integer,
): RegExpExecArray | null {
	// If we got a Regexp object, make our own copy, so the original's object
	// lastIndex is not potentially mutated by us.
	if (!isString(regex)) {
		narrowType<RegExp>(regex)
		regex = regex.source
	}

	regex = new RegExp(regex, 'g')
	regex.lastIndex = index
	return regex.exec(subject)
}

export function stringAfterFirstNeedle(input: string, needle: string): string | null {
	const index = input.indexOf(needle)
	if (index === -1) {
		return null
	}

	return input.substring(input.indexOf(needle) + needle.length)
}

export function stringBeforeFirstNeedle(input: string, needle: string): string | null {
	const index = input.indexOf(needle)
	if (index === -1) {
		return null
	}

	return input.substring(0, input.indexOf(needle))
}
