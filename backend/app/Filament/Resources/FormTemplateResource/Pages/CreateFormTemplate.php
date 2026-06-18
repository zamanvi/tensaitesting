<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use Filament\Resources\Pages\CreateRecord;

class CreateFormTemplate extends CreateRecord
{
    protected static string $resource = FormTemplateResource::class;

    protected function getCreateFormAction()
    {
        return parent::getCreateFormAction()->label('Save');
    }

    protected function getCreateAnotherFormAction()
    {
        return parent::getCreateAnotherFormAction()
            ->extraAttributes(['style' => 'display:none']);
    }

    public ?int $createdRecordId = null;

    protected function afterCreate(): void
    {
        $this->createdRecordId = $this->getRecord()->id;

        $structure = json_decode($this->data['form_structure'] ?? '[]', true);
        if (! empty($structure)) {
            FormTemplateResource::syncStructure($this->getRecord(), $structure);
        }
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('edit', ['record' => $this->createdRecordId]);
    }
}
