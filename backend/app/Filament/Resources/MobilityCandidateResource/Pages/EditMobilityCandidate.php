<?php

namespace App\Filament\Resources\MobilityCandidateResource\Pages;

use App\Filament\Resources\MobilityCandidateResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditMobilityCandidate extends EditRecord
{
    protected static string $resource = MobilityCandidateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
            Actions\RestoreAction::make(),
            Actions\ForceDeleteAction::make(),
        ];
    }
}
