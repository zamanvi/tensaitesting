<?php

namespace App\Filament\Resources\ApplicationResource\Pages;

use App\Filament\Resources\ApplicationResource;
use Filament\Resources\Pages\CreateRecord;

class CreateApplication extends CreateRecord
{
    protected static string $resource = ApplicationResource::class;

    protected static string $view = 'filament.resources.application-resource.pages.create-application';

    public function getTitle(): string { return ''; }
    public function getHeading(): string { return ''; }
    public function getBreadcrumbs(): array { return []; }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['user_id']           = auth()->id();
        $data['submitted_by_role'] = 'admin';
        // Preserve any form_data already filled on the create page (birth_date,
        // passport_no, dynamic fields, education). Don't wipe it.
        $data['form_data']         = $data['form_data'] ?? [];
        $data['progress']          = 0;
        return $data;
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('edit', ['record' => $this->getRecord()]);
    }

}
