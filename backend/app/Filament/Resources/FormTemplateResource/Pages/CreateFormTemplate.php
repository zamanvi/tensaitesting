<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\CreateRecord;

class CreateFormTemplate extends CreateRecord
{
    protected static string $resource = FormTemplateResource::class;

    public ?int $createdRecordId = null;
    public bool $publishAfterCreate = false;
    public bool $previewAfterCreate = false;

    public function getTitle(): string
    {
        return 'New Country Form';
    }

    protected function getCreateFormAction(): Action
    {
        return parent::getCreateFormAction()
            ->label('Save as Draft')
            ->icon('heroicon-o-document');
    }

    protected function getCreateAnotherFormAction(): Action
    {
        return parent::getCreateAnotherFormAction()
            ->extraAttributes(['style' => 'display:none']);
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('save_publish')
                ->label('Save & Publish')
                ->icon('heroicon-o-rocket-launch')
                ->color('success')
                ->action(function () {
                    $this->publishAfterCreate = true;
                    $this->create();
                }),

            Action::make('save_preview')
                ->label('Save & Preview')
                ->icon('heroicon-o-eye')
                ->color('info')
                ->action(function () {
                    $this->previewAfterCreate = true;
                    $this->create();
                }),
        ];
    }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        unset($data['form_structure'], $data['saved_structure']);

        if ($this->publishAfterCreate) {
            $data['status']    = 'published';
            $data['is_active'] = true;
        }

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

        if ($this->publishAfterCreate) {
            Notification::make()->title('Form saved and published — now live')->success()->send();
        }
    }

    protected function getRedirectUrl(): string
    {
        $url = $this->getResource()::getUrl('edit', ['record' => $this->createdRecordId]);

        if ($this->previewAfterCreate) {
            $url .= '?preview=1';
        }

        return $url;
    }
}
