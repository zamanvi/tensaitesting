<?php

namespace App\Filament\Resources\FormTemplateFieldResource\Pages;

use App\Filament\Resources\FormTemplateFieldResource;
use App\Filament\Resources\FormTemplateResource;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditFormTemplateField extends EditRecord
{
    protected static string $resource = FormTemplateFieldResource::class;

    public function getTitle(): string
    {
        $label = $this->getRecord()->label ?: 'Field';
        return 'Edit Field — ' . $label;
    }

    protected function getRedirectUrl(): string
    {
        $templateId = $this->getRecord()->form_template_id;
        return FormTemplateResource::getUrl('edit', ['record' => $templateId]);
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'Field saved';
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('back')
                ->label('Back to Form')
                ->icon('heroicon-o-arrow-left')
                ->color('gray')
                ->url(fn () => FormTemplateResource::getUrl('edit', ['record' => $this->getRecord()->form_template_id])),
        ];
    }
}
