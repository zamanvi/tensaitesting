<?php

namespace App\Filament\Resources\InstitutionProfileResource\Pages;

use App\Filament\Resources\InstitutionProfileResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditInstitutionProfile extends EditRecord
{
    protected static string $resource = InstitutionProfileResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }
}
