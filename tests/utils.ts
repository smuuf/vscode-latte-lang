import * as fs from "fs"

export function readDataFile(name: string): string {
	// .trimEnd() to remove any white space (newlines) at EOF editors might
	// put in there.
	return fs.readFileSync(`${__dirname}/data/${name}`,{encoding: 'utf-8'}).trimEnd()
}
