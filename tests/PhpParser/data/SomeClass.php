<?php

declare(strict_types=1);

namespace App\Model\Services;

use Nette\SmartObject;
use Nette\Database\Table\ActiveRow;

use App\Model\Entities\DbArtifact;
use App\Model\Entities\DbBucket;

class SomeClass {

  use SmartObject;

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
  }

}
