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
        return 'Service Forms';
    }

    protected function getTableQuery(): Builder
    {
        // Show drafts too (e.g. abandoned "New Country Form" clicks) so nothing is
        // silently invisible — use the Status filter to narrow to published only.
        return \App\Models\FormTemplate::query()->orderBy('country');
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('new_form')
                ->label('New Service Form')
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
