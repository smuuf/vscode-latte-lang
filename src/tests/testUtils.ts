import * as fs from 'fs'

export function readTestDataFile(name: string, dirName: string = ''): string {
	// .trimEnd() to remove any white space (newlines) at EOF editors might
	// put in there.
	dirName = dirName || __dirname
	return fs.readFileSync(`${dirName}/data/${name}`, { encoding: 'utf-8' }).trimEnd()
}
