import Stack from "../../utils/Stack"

export const enum RegionType {
	HTML = 'html',
	HTML_TAG = 'html_tag',
	LATTE = 'latte',
	QUOTES_S = 'quotes_s',
	QUOTES_D = 'quotes_d',
}

export interface ScannerState {
	offset: number
	line: number
	character: number
	maxOffset: number
	lastLatteOpenTagOffset: number
	regionTypeStack: Stack<RegionType>
}
