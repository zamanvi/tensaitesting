<?php

namespace App\Filament\Resources\AnswerLibraryItemResource\Pages;

use App\Filament\Resources\AnswerLibraryItemResource;
use App\Models\AnswerLibraryItem;
use App\Support\SswStarterLibrary;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListAnswerLibraryItems extends ListRecords
{
    protected static string $resource = AnswerLibraryItemResource::class;

    public function getSubheading(): ?string
    {
        return 'Only Verified answers are shown to users. Edit an answer and it goes back to Draft until you verify it again.';
    }

    protected function getHeaderActions(): array
    {
        return [
            // Adds the starter SSW questions that are not there yet, as DRAFTS.
            // Never overwrites or re-opens anything staff already have.
            Actions\Action::make('import_starter')
                ->label('Import starter SSW questions')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('gray')
                ->requiresConfirmation()
                ->modalHeading('Import the starter questions?')
                ->modalDescription('About 25 draft questions and answers on the Japan SSW route, each with its source and a note on what to check. They are added as Drafts and nobody sees them until you verify them. Entries you already have are left untouched.')
                ->action(function () {
                    $added = 0;

                    foreach (SswStarterLibrary::items() as $row) {
                        $item = AnswerLibraryItem::firstOrCreate(
                            ['slug' => $row['slug']],
                            $row + ['status' => 'draft']
                        );
                        $added += $item->wasRecentlyCreated ? 1 : 0;
                    }

                    Notification::make()
                        ->title($added > 0 ? "{$added} draft question(s) added" : 'Nothing new to add')
                        ->body($added > 0 ? 'Check each one against its source, then press Verify.' : null)
                        ->success()
                        ->send();
                }),

            Actions\CreateAction::make()->label('Add answer'),
        ];
    }
}
