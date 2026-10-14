<?php

namespace App\Filament\Resources\MobilityCandidateResource\Pages;

use App\Filament\Resources\MobilityCandidateResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListMobilityCandidates extends ListRecords
{
    protected static string $resource = MobilityCandidateResource::class;

    // Turning the assistant on is one button on a row ("Activate Assistant") or
    // on the Users list, so there is no separate form up here. This button is
    // only for a person who walks in and has no chat record or account yet.
    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()->label('Add skilled professional'),
        ];
    }
}
