import { readTestDataFile } from '../../../tests/testUtils'
import { captureBalanced } from '../captureBalanced'
import { BalancedCaptureResult } from '../types'

const EXPECTED_1 = `use SmartObject;

  public function __construct(
    private EntityFileSystemService $entityFileSystemService,
  ) {}

  public function wakeupArtifact(?ActiveRow $row): ?DbArtifact {
    return $row
      ? new DbArtifact($row, $this, $this->entityFileSystemService)
      : null;
  }

  public function wakeupBucket(?ActiveRow $row): ?DbBucket {
    return $row
      ? new DbBucket($row, $this, $this->entityFileSystemService)
      : null;
  }`

const EXPECTED_2 = `private EntityFileSystemService $entityFileSystemService,`

test('captureBalanced: PHP class contents', () => {
	const str = readTestDataFile(`SomeClass.php`)
	let result: BalancedCaptureResult | null

	result = captureBalanced(['{', '}'], str, 0)
	expect(result?.content.trim()).toBe(EXPECTED_1)
	expect(result?.offset).toBe(210)

	result = captureBalanced(['(', ')'], str, 0)
	expect(result?.content.trim()).toBe('strict_types=1')
	expect(result?.offset).toBe(15)

	result = captureBalanced(['(', ')'], str, 256)
	expect(result?.content.trim()).toBe(EXPECTED_2)
	expect(result?.offset).toBe(262)

	result = captureBalanced(['{', '}'], str, 256)
	expect(result?.content.trim()).toBe('')
	expect(result?.offset).toBe(330)
})

test('captureBalanced: Basics', () => {
	let str: string
	let result: BalancedCaptureResult | null

	str = 'aaa{abc}ccc'
	result = captureBalanced(['{', '}'], str, 0)
	expect(result?.content).toBe('abc')
	expect(result?.offset).toBe(4)

	str = "aaa'abc'ccc"
	result = captureBalanced(["'", "'"], str, 0)
	expect(result?.content).toBe('abc')
	expect(result?.offset).toBe(4)
})
