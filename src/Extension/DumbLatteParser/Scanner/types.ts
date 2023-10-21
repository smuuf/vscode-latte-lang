import Stack from '../../utils/Stack'

export const enum RegionType {
	HTML = 'html',
	HTML_TAG = 'html_tag',
	LATTE_TAG = 'latte_tag',
	QUOTES_S = 'quotes_single',
	QUOTES_D = 'quotes_double',
}

export interface ScannerState {
	offset: number
	line: number
	character: number
	maxOffset: number
	lastLatteOpenTagOffset: number
	regionTypeStack: Stack<RegionType>
}

export type DumbTagConstructorArgs = {
	name: string
	nameOffset: integer
	args: string
	argsOffset: integer
	tagRange: { startOffset: integer; endOffset: integer }
	regionType: RegionType
}
