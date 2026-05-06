<?php

namespace App\Filament\Resources\AgencyProfileResource\Pages;

use App\Filament\Resources\AgencyProfileResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListAgencyProfiles extends ListRecords
{
    protected static string $resource = AgencyProfileResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
