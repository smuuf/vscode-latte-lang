<?php

declare(strict_types=1);

namespace App\Model\Services;

use Nette\SmartObject;
use Nette\Database\Table\ActiveRow;

use App\Model\Entities\DbArtifact;
use App\Model\Entities\DbBucket;
use Entity\Service\EntityFileSystemService;

class SomeClass {

	use SmartObject;

	public ?string $someClass_prop_1;
	public static int|bool $someClass_prop_2_static;
	protected bool $someClass_prop_3_protected;
	public DbArtifact $someClass_prop_4;
	public \DbArtifact $someClass_prop_5; // Intentionally wrong - absolute namespace.

	public function __construct(
		public EntityFileSystemService|bool $entityFileSystemService,
		public \GlobalFileSystemService $globalFileSystemService,
	) {}

	public function someClass_method_1_public(string $stringArg): bool {
		return true;
	}

	public function someClass_method_2_public(SomeClass $someClassArg): SomeSubClass {
		return $this;
	}

	public static function someClass_method_3_public_static(): string {
		return self::class;
	}

	private function someClass_method_4_private(): array|bool {
		return [];
	}

	/**
	 * lol dockblock
	 * @return MyInt
	 */
	protected function someClass_method_5_protected(): int {
		return 1;
	}
}
