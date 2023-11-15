import { PhpClassInfo, PhpMethodInfo, SymbolVisibility } from '../DumbPhpParser/types'

/**
 * NOTE: Standalone decoupled implementation of method in
 * PhpWorkspaceInfoProvider class, because easier testing.
 */
export function getPublicMethodsOfClass(
	classInfo: PhpClassInfo,
	classInfoGetter: (classFqn: string) => PhpClassInfo | null,
): PhpMethodInfo[] {
	const classInfoHierarchyList = [classInfo]

	// If the class has a parent class, iterate up the class hierarchy and
	// collect all class-infos up to the top - we're going to collect
	// methods from all of them, because inheritance.
	let tmpClassInfo: PhpClassInfo | null = classInfo
	while (tmpClassInfo && tmpClassInfo.parentFqn) {
		tmpClassInfo = classInfoGetter(tmpClassInfo.parentFqn)
		if (tmpClassInfo) {
			classInfoHierarchyList.push(tmpClassInfo)
		}
	}

	// We'll keep track of unique method names - we only want to keep the
	// first encountered method name (from the most sub-class where
	// it was found).
	let uniqueNames = new Set()
	let result: PhpMethodInfo[] = []

	for (classInfo of classInfoHierarchyList) {
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
