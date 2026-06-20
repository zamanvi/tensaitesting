<?php

namespace App\Filament\Resources\ApplicationResource\Pages;

use App\Filament\Resources\ApplicationResource;
use Filament\Resources\Pages\CreateRecord;

class CreateApplication extends CreateRecord
{
    protected static string $resource = ApplicationResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['user_id']           = auth()->id();
        $data['submitted_by_role'] = 'admin';
        $data['form_data']         = [];
        $data['progress']          = 0;
        return $data;
    }
}
