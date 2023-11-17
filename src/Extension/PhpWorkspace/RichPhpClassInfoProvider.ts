import { PhpClassInfo, PhpMethodInfo, SymbolVisibility } from '../DumbPhpParser/types'

export class RichPhpClassInfoProvider {
	constructor(private classInfoGetter: (classFqn: string) => PhpClassInfo | null) {}

	private getClassHierarchyList(originClass: PhpClassInfo) {
		const result = [originClass]

		// If the class has a parent class, iterate up the class hierarchy and
		// collect all class-infos up to the top - we're going to collect
		// methods from all of them, because inheritance.
		let tmpClassInfo: PhpClassInfo | null = originClass
		while (tmpClassInfo && tmpClassInfo.parentFqn) {
			tmpClassInfo = this.classInfoGetter(tmpClassInfo.parentFqn)
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
	public getMethod(name: string, classInfo: PhpClassInfo): PhpMethodInfo | null {
		const hierarchyList = this.getClassHierarchyList(classInfo)

		for (const clsInfo of hierarchyList) {
			const value = clsInfo.methods.get(name)
			if (value !== undefined) {
				return value
			}
		}

		return null
	}

	public getPublicMethods(classInfo: PhpClassInfo): PhpMethodInfo[] {
		const hierarchyList = this.getClassHierarchyList(classInfo)

		// We'll keep track of unique method names - we only want to keep the
		// first encountered method name (from the most sub-class where
		// it was found).
		let uniqueNames = new Set()
		let result: PhpMethodInfo[] = []

		for (classInfo of hierarchyList) {
			// Append found methods from each class in our hierarchy to our
			// single list of methods.
			result = result.concat(
				Array.from(classInfo.methods.values()).filter((method: PhpMethodInfo) => {
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
}
