import { captureBalanced } from '../../src/Extension/DumbPhpParser/parser'
import { BalancedCaptureResult } from '../../src/Extension/DumbPhpParser/types'
import { readDataFile } from '../utils'

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

test('captureBalanced', () => {
	const str = readDataFile(`SomeClass.php`, __dirname)
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
