<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use App\Models\FormFieldGroup;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditFormTemplate extends EditRecord
{
    protected static string $resource = FormTemplateResource::class;

    public function getTitle(): string
    {
        $record = $this->getRecord();
        $country = $record->country ?: null;
        $name    = $record->name    ?: null;

        if ($country && $name) return $country . ' — ' . $name;
        if ($country)          return $country . ' Form';
        if ($name)             return $name;
        return 'New Country Form';
    }

    public function mount(int | string $record): void
    {
        parent::mount($record);

        if (request()->query('preview') === '1') {
            $this->dispatch('open-modal', id: 'preview-form-modal');
        }
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        unset($data['form_structure'], $data['saved_structure']);
        return $data;
    }

    protected function afterSave(): void
    {
        try {
            $raw = $this->data['form_structure'] ?? '[]';
            $structure = json_decode((string) $raw, true);
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

    public function deleteFieldGroup(int $groupId): void
    {
        FormFieldGroup::where('id', $groupId)
            ->where('form_template_id', $this->getRecord()->id)
            ->delete();

        $this->redirect($this->getResource()::getUrl('edit', ['record' => $this->getRecord()]));
    }

    public function publishTemplate(): void
    {
        $this->getRecord()->update(['status' => 'published', 'is_active' => true]);
        Notification::make()->title('Form published — now live to branches')->success()->send();
        $this->redirect($this->getResource()::getUrl('edit', ['record' => $this->getRecord()]));
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('publish')
                ->label(fn () => $this->getRecord()->status === 'published' ? 'Unpublish' : 'Publish')
                ->icon(fn () => $this->getRecord()->status === 'published' ? 'heroicon-o-arrow-uturn-left' : 'heroicon-o-rocket-launch')
                ->color(fn () => $this->getRecord()->status === 'published' ? 'warning' : 'success')
                ->requiresConfirmation()
                ->action(function () {
                    $record = $this->getRecord();
                    if ($record->status === 'published') {
                        $record->update(['status' => 'draft']);
                        Notification::make()->title('Form unpublished — moved back to draft')->warning()->send();
                    } else {
                        $record->update(['status' => 'published', 'is_active' => true]);
                        Notification::make()->title('Form published — now live to branches')->success()->send();
                    }
                    $this->redirect($this->getResource()::getUrl('edit', ['record' => $record]));
                }),

            Actions\Action::make('preview')
                ->label('Preview Form')
                ->icon('heroicon-o-eye')
                ->color('info')
                ->modalHeading('Form Preview')
                ->modalWidth('4xl')
                ->modalSubmitAction(false)
                ->modalCancelActionLabel('Close')
                ->modalContent(fn () => view('filament.forms.components.form-preview', [
                    'record' => $this->getRecord(),
                ])),

            Actions\DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
