<?php

namespace App\Filament\Resources\AnswerLibraryItemResource\Pages;

use App\Filament\Resources\AnswerLibraryItemResource;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditAnswerLibraryItem extends EditRecord
{
    protected static string $resource = AnswerLibraryItemResource::class;

    // The model already sends an edited verified answer back to draft; say so.
    protected function afterSave(): void
    {
        if ($this->record->wasChanged('status') && $this->record->status === 'draft') {
            Notification::make()
                ->title('Saved as a draft')
                ->body('You changed a verified answer, so it is hidden from users until you verify it again.')
                ->warning()
                ->send();
        }
    }
}
