<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use App\Models\FormTemplate;
use Filament\Actions;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;

class ListFormTemplates extends ListRecords
{
    protected static string $resource = FormTemplateResource::class;

    public function getTitle(): string
    {
        return 'Country Forms';
    }

    public function getTabs(): array
    {
        return [
            'published' => Tab::make('Published')
                ->icon('heroicon-o-rocket-launch')
                ->badge(fn () => \App\Models\FormTemplate::where('status', 'published')->count())
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', 'published')),

            'drafts' => Tab::make('Drafts')
                ->icon('heroicon-o-pencil-square')
                ->badge(fn () => \App\Models\FormTemplate::where('status', 'draft')->count())
                ->badgeColor('warning')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', 'draft')),
        ];
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
