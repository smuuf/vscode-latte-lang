import {
	PhpClassInfo,
	PhpClassPropInfo,
	PhpMethodInfo,
	SymbolVisibility,
} from '../phpParser/types'

export class PhpClass {
	constructor(
		public readonly info: PhpClassInfo,
		private classInfoGetter: (classFqn: string) => Promise<PhpClassInfo | null>,
	) {}

	private async getClassHierarchyList(): Promise<PhpClassInfo[]> {
		const result = [this.info]

		// If the class has a parent class, iterate up the class hierarchy and
		// collect all class-infos up to the top - we're going to collect
		// methods from all of them, because inheritance.
		let tmpClassInfo: PhpClassInfo | null = this.info
		while (tmpClassInfo && tmpClassInfo.parentFqn) {
			tmpClassInfo = await this.classInfoGetter(tmpClassInfo.parentFqn)
			if (tmpClassInfo) {
				result.push(tmpClassInfo)
			}
		}

		return result
	}

	/**
	 * Retrieves `PhpMethodInfo` from a class while taking type hierarchy into
	 * accounts.
	 */
	public async getMethod(name: string): Promise<PhpMethodInfo | null> {
		const hierarchyList = await this.getClassHierarchyList()

		for (const clsInfo of hierarchyList) {
			const value = clsInfo.methods[name]
			if (value !== undefined) {
				return value
			}
		}

		return null
	}

	public async getPublicMethods(): Promise<PhpMethodInfo[]> {
		const hierarchyList = await this.getClassHierarchyList()

		// We'll keep track of unique method names - we only want to keep the
		// first encountered method name (from the most sub-class where
		// it was found).
		let uniqueNames = new Set()
		let result: PhpMethodInfo[] = []

		for (const classInfo of hierarchyList) {
			// Append found methods from each class in our hierarchy to our
			// single list of methods.
			result = result.concat(
				Object.values(classInfo.methods ?? []).filter((method: PhpMethodInfo) => {
					const include =
						method.flags.visibility === SymbolVisibility.PUBLIC && // Only public.
						!uniqueNames.has(method.name) && // Only if not yet encountered.
						!method.name.match(/^__/) // Exclude PHP magic methods.
					if (include) {
						uniqueNames.add(method.name)
					}
					return include
				}),
			)
		}

		return result
	}

	public async getPublicProps(): Promise<PhpClassPropInfo[]> {
		const hierarchyList = await this.getClassHierarchyList()

		// We'll keep track of unique property names - we only want to keep the
		// first encountered property name (from the most sub-class where
		// it was found).
		let uniqueNames = new Set()
		let result: PhpClassPropInfo[] = []

		for (const classInfo of hierarchyList) {
			// Append found properties from each class in our hierarchy to our
			// single list of properties.
			result = result.concat(
				Object.values(classInfo.properties ?? []).filter(
					(prop: PhpClassPropInfo) => {
						const include =
							prop.flags.visibility === SymbolVisibility.PUBLIC && // Only public.
							!uniqueNames.has(prop.name) // Only if not yet encountered.
						if (include) {
							uniqueNames.add(prop.name)
						}
						return include
					},
				),
			)
		}

		return result
	}
}
