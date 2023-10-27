import { captureBalanced } from '../utils/captureBalanced'
import { matchRegexAtPosition } from '../utils/common'

export class ArgsParser {
	private _offset: integer = 0
	private input: string

	constructor(input: string) {
		this.input = input
	}

	public reset(): void {
		this._offset = 0
	}

	public get offset(): integer {
		return this._offset
	}

	public consumeWhitespace(): null {
		const match = this.peekRegex(/\s*/)
		if (match === null) {
			return null
		}

		this._offset += match[0].length
		return null
	}

	public peekRegex(regex: string | RegExp): RegExpMatchArray | null {
		return matchRegexAtPosition(regex, this.input, this._offset)
	}

	public consumeRegex(regex: string | RegExp): RegExpMatchArray | null {
		const match = this.peekRegex(regex)
		if (match === null) {
			return null
		}

		this._offset += match[0].length
		this.consumeWhitespace() // Eat any additional whitespace.
		return match
	}

	public peekAnyOfStrings(...strs: string[]): string | null {
		for (const str of strs) {
			const peeked = this.peekString(str)
			if (peeked !== null) {
				return peeked
			}
		}

		return null
	}

	public consumeAnyOfStrings(...strs: string[]): string | null {
		const match = this.peekAnyOfStrings(...strs)
		if (match !== null) {
			this._offset += match.length
			this.consumeWhitespace() // Eat any additional whitespace.
			return match
		}

		return null
	}

	public peekQuotedStringOrWord(): string | null {
		const foundQuotes =
			captureBalanced(["'", "'"], this.input, this._offset, true) ||
			captureBalanced(['"', '"'], this.input, this._offset, true)

		if (foundQuotes) {
			return foundQuotes.content
		}

		const foundWord = this.peekRegex(/[^\s]+/)
		if (foundWord) {
			return foundWord[0]
		}

		return null
	}

	public consumeQuotedStringOrWord(): string | null {
		const match = this.peekQuotedStringOrWord()
		if (match !== null) {
			this._offset += match.length
			this.consumeWhitespace() // Eat any additional whitespace.
			return match
		}

		return null
	}

	public peekString(str: string): string | null {
		const inputSubstring = this.input.substring(
			this._offset,
			this._offset + str.length,
		)
		return inputSubstring === str ? str : null
	}

	public consumeString(str: string): string | null {
		const match = this.peekString(str)
		if (match !== null) {
			this._offset += match.length
			this.consumeWhitespace() // Eat any additional whitespace.
			return match
		}

		return null
	}

	public peekWord(str: string): string | null {
		const inputSubstring = this.input.substring(
			this._offset,
			this._offset + str.length,
		)
		if (inputSubstring !== str) {
			return null
		}

		// The word be also followed by a writespace.
		if (!matchRegexAtPosition(/\s/, this.input, this._offset + str.length)) {
			return null
		}

		return str
	}

	public consumeWord(str: string): string | null {
		const match = this.peekWord(str)
		if (match !== null) {
			this._offset += match.length
			this.consumeWhitespace() // Eat any additional whitespace.
			return match
		}

		return null
	}

	public peekAnyOfWords(...strs: string[]): string | null {
		for (const str of strs) {
			const peeked = this.peekWord(str)
			if (peeked !== null) {
				return peeked
			}
		}

		return null
	}

	public consumeAnyOfWords(...strs: string[]): string | null {
		const match = this.peekAnyOfWords(...strs)
		if (match !== null) {
			this._offset += match.length
			this.consumeWhitespace() // Eat any additional whitespace.
			return match
		}

		return null
	}
}
