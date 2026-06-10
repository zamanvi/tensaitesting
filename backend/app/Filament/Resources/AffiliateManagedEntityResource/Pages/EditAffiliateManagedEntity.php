<?php

namespace App\Filament\Resources\AffiliateManagedEntityResource\Pages;

use App\Filament\Resources\AffiliateManagedEntityResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditAffiliateManagedEntity extends EditRecord
{
    protected static string $resource = AffiliateManagedEntityResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }
}
