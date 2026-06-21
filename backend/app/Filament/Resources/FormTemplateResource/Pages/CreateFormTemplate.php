<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\CreateRecord;

class CreateFormTemplate extends CreateRecord
{
    protected static string $resource = FormTemplateResource::class;

    public function getTitle(): string
    {
        return 'New Application Form';
    }

    protected function getCreateFormAction(): \Filament\Actions\Action
    {
        return parent::getCreateFormAction()->label('Save');
    }

    protected function getCreateAnotherFormAction(): \Filament\Actions\Action
    {
        return parent::getCreateAnotherFormAction()
            ->extraAttributes(['style' => 'display:none']);
    }

    public ?int $createdRecordId = null;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        unset($data['form_structure'], $data['saved_structure']);
        return $data;
    }

    protected function afterCreate(): void
    {
        $this->createdRecordId = $this->getRecord()->id;

        try {
            $structure = json_decode($this->data['form_structure'] ?? '[]', true);
            if (! empty($structure)) {
                FormTemplateResource::syncStructure($this->getRecord(), $structure);
            }
        } catch (\Throwable $e) {
            Notification::make()
                ->title('Fields could not be saved: ' . $e->getMessage())
                ->danger()
                ->send();
        }
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('edit', ['record' => $this->createdRecordId]);
    }
}
