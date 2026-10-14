<?php

namespace App\Filament\Resources\ApprovedCvResource\Pages;

use App\Filament\Resources\ApprovedCvResource;
use Filament\Resources\Pages\ListRecords;

class ListApprovedCvs extends ListRecords
{
    protected static string $resource = ApprovedCvResource::class;

    public function getSubheading(): ?string
    {
        return 'CVs that staff checked and approved. Still being filled in, or waiting for review? Those are in Skilled Professionals.';
    }
}
