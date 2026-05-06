<?php

namespace App\Filament\Resources\AgencyProfileResource\Pages;

use App\Filament\Resources\AgencyProfileResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditAgencyProfile extends EditRecord
{
    protected static string $resource = AgencyProfileResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
