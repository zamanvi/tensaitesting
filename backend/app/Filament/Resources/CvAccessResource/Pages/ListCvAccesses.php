<?php

namespace App\Filament\Resources\CvAccessResource\Pages;

use App\Filament\Resources\CvAccessResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListCvAccesses extends ListRecords
{
    protected static string $resource = CvAccessResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()->label('Open My CV for an account')];
    }
}
