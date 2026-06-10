<?php

namespace App\Filament\Resources\AffiliateManagedEntityResource\Pages;

use App\Filament\Resources\AffiliateManagedEntityResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAffiliateManagedEntities extends ListRecords
{
    protected static string $resource = AffiliateManagedEntityResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
