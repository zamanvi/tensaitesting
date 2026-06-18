<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use App\Models\FormFieldGroup;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Log;

class EditFormTemplate extends EditRecord
{
    protected static string $resource = FormTemplateResource::class;

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
            Log::error('afterSave syncStructure error', [
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);
            throw $e;
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
        return [Actions\DeleteAction::make()];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
