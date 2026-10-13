<?php

namespace App\Filament\Resources\AnswerLibraryItemResource\Pages;

use App\Filament\Resources\AnswerLibraryItemResource;
use Filament\Resources\Pages\CreateRecord;

class CreateAnswerLibraryItem extends CreateRecord
{
    protected static string $resource = AnswerLibraryItemResource::class;

    // A new answer always starts as a draft; verifying is a separate, deliberate step.
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['status'] = 'draft';

        return $data;
    }

    // "Add to library" from the asked-questions list passes the wording along.
    protected function fillForm(): void
    {
        parent::fillForm();

        if ($q = request()->query('question')) {
            $this->form->fill([
                'question_en' => mb_substr((string) $q, 0, 255),
                'category'    => 'ssw_basics',
                'slug'        => 'q-' . now()->format('ymd-His'),
            ]);
        }
    }
}
