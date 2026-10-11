<?php

namespace App\Filament\Resources\MobilityCandidateResource\Pages;

use App\Filament\Resources\MobilityCandidateResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListMobilityCandidates extends ListRecords
{
    protected static string $resource = MobilityCandidateResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()->label('Add candidate')];
    }
}
