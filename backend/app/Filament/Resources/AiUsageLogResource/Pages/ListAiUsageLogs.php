<?php

namespace App\Filament\Resources\AiUsageLogResource\Pages;

use App\Filament\Resources\AiUsageLogResource;
use Filament\Resources\Pages\ListRecords;

class ListAiUsageLogs extends ListRecords
{
    protected static string $resource = AiUsageLogResource::class;

    public function getSubheading(): ?string
    {
        return 'Every call the website makes to an AI service: counts and estimated cost only, never the text. '
            . 'Costs are estimates from config/ai.php; a model without a listed price shows "not priced".';
    }
}
