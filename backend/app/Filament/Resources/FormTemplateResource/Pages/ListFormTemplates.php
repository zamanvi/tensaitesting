<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListFormTemplates extends ListRecords
{
    protected static string $resource = FormTemplateResource::class;

    public function getTitle(): string
    {
        return 'Country Forms';
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()->label('New Country Form')->icon('heroicon-o-plus'),
        ];
    }
}
