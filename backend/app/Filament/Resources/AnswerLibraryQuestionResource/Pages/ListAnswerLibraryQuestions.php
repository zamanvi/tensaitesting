<?php

namespace App\Filament\Resources\AnswerLibraryQuestionResource\Pages;

use App\Filament\Resources\AnswerLibraryQuestionResource;
use Filament\Resources\Pages\ListRecords;

class ListAnswerLibraryQuestions extends ListRecords
{
    protected static string $resource = AnswerLibraryQuestionResource::class;

    public function getSubheading(): ?string
    {
        return 'What people asked the Answer Library. Questions it could not answer are the list of entries to write next.';
    }
}
