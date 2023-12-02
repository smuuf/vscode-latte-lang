import { parsePhpType } from '../phpTypeParser/phpTypeParser'
import { CLASS_NAME_REGEX, NAME_REGEX, VARIABLE_REGEX } from '../regexes'

export function isValidName(s: string): boolean {
	return NAME_REGEX.test(s)
}

export function isValidClassName(s: string): boolean {
	return CLASS_NAME_REGEX.test(s)
}

export function isValidVariableName(s: string): boolean {
	return VARIABLE_REGEX.test(s)
}

export function isValidTypeSpec(s: string): boolean {
	return !!parsePhpType(s)
}
