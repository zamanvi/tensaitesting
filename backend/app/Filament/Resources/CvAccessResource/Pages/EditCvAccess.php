<?php

namespace App\Filament\Resources\CvAccessResource\Pages;

use App\Filament\Resources\CvAccessResource;
use Filament\Resources\Pages\EditRecord;

class EditCvAccess extends EditRecord
{
    protected static string $resource = CvAccessResource::class;

    // The shareable link's token is created the first time it is switched on.
    protected function afterSave(): void
    {
        if ($this->record->public_enabled) {
            $this->record->ensureToken();
        }
    }
}
