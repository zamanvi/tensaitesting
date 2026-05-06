<?php

namespace App\Filament\Resources\OcrJobResource\Pages;

use App\Filament\Resources\OcrJobResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditOcrJob extends EditRecord
{
    protected static string $resource = OcrJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
