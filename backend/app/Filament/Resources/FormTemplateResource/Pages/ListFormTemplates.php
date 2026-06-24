<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use App\Models\FormTemplate;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;

class ListFormTemplates extends ListRecords
{
    protected static string $resource = FormTemplateResource::class;

    public function getTitle(): string
    {
        return 'Country Forms';
    }

    protected function getTableQuery(): Builder
    {
        return \App\Models\FormTemplate::query()->where('status', 'published')->orderBy('country');
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('new_form')
                ->label('New Country Form')
                ->icon('heroicon-o-plus')
                ->action(function () {
                    $record = FormTemplate::create([
                        'country'   => '',
                        'name'      => '',
                        'status'    => 'draft',
                        'is_active' => false,
                    ]);

                    $this->redirect(
                        FormTemplateResource::getUrl('edit', ['record' => $record->id])
                    );
                }),
        ];
    }
}
