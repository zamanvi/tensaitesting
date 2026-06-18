<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Log;

class EditFormTemplate extends EditRecord
{
    protected static string $resource = FormTemplateResource::class;

    protected function afterSave(): void
    {
        try {
            $raw = $this->data['form_structure'] ?? '[]';
            Log::info('afterSave form_structure raw', ['raw' => substr((string)$raw, 0, 500)]);
            $structure = json_decode($raw, true);
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

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
