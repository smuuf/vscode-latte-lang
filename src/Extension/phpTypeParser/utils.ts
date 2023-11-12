import { PhpType } from './phpTypeParser'

/**
 * Returns the PHP class name string without any namespace (i.e. returns
 * the part of the string after final '\' backslash or the whole string if
 * there is none).
 */
export function getClassBaseName(name: string): string {
	return name.substring(name.lastIndexOf('\\') + 1)
}

export function getPhpTypeRepr(type: PhpType | null | undefined): string {
	return type?.repr ?? 'mixed'
}
