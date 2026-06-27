<?php

namespace App\Filament\Resources\ApplicationResource\Pages;

use App\Filament\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\ApplicationDocument;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Storage;

class EditApplication extends EditRecord
{
    protected static string $resource = ApplicationResource::class;

    public function getTitle(): string
    {
        $record = $this->getRecord();
        return 'Application — ' . $record->student_name . ' → ' . ($record->formTemplate?->country ?? '');
    }

    protected function afterSave(): void
    {
        $record = $this->getRecord();
        $this->syncFilamentDocuments($record);
        $progress = $record->recalculateProgress();
        $record->update(['progress' => $progress]);
    }

    protected function syncFilamentDocuments(Application $app): void
    {
        $formData = $app->form_data ?? [];
        $disk     = Storage::disk('public');

        foreach ($formData as $key => $value) {
            if (! $value || ! is_string($value)) continue;

            // Matches: edu_0_document, edu_1_document, ...
            if (preg_match('/^edu_(\d+)_document$/', $key, $m)) {
                $docType = "edu_{$m[1]}";
                $label   = "Education Document";
            }
            // Matches: boxdoc_123
            elseif (preg_match('/^boxdoc_(\d+)$/', $key, $m)) {
                $docType = "boxdoc_{$m[1]}";
                $label   = "Supporting Document";
            } else {
                continue;
            }

            if (! $disk->exists($value)) continue;

            ApplicationDocument::updateOrCreate(
                ['application_id' => $app->id, 'doc_type' => $docType],
                [
                    'field_key'     => $docType,
                    'label'         => $label,
                    'file_path'     => $value,
                    'original_name' => basename($value),
                    'file_size'     => $disk->size($value),
                    'mime_type'     => $disk->mimeType($value) ?? 'application/octet-stream',
                ]
            );
        }
    }

    protected function getHeaderActions(): array
    {
        $record = $this->getRecord();

        return [
            // Progress badge — always visible, shows current completion
            Actions\Action::make('progress_indicator')
                ->label(fn () => $this->getRecord()->progress . '% Complete')
                ->color(fn () => $this->getRecord()->progress >= 80 ? 'success'
                    : ($this->getRecord()->progress >= 50 ? 'warning' : 'danger'))
                ->icon(fn () => $this->getRecord()->progress >= 50
                    ? 'heroicon-o-check-circle' : 'heroicon-o-clock')
                ->tooltip(fn () => $this->getRecord()->progress >= 50
                    ? 'Form is ready to submit'
                    : 'Fill ' . (50 - $this->getRecord()->progress) . '% more to unlock Submit')
                ->disabled()
                ->extraAttributes(['style' => 'cursor:default;pointer-events:none;']),

            // Submit — only unlocks at 50%+
            Actions\Action::make('submit_application')
                ->label(fn () => $this->getRecord()->status === 'submitted' ? '↺ Resubmit' : '✈ Submit Application')
                ->icon('heroicon-o-paper-airplane')
                ->color('success')
                ->visible(fn () => $this->getRecord()->progress >= 50
                    && !in_array($this->getRecord()->status, ['accepted', 'rejected']))
                ->requiresConfirmation()
                ->modalHeading('Submit this application?')
                ->modalDescription('This application will be sent to the admin panel for review. You can still edit it after submitting.')
                ->modalSubmitActionLabel('Yes, Submit Now')
                ->action(function () {
                    $this->getRecord()->update([
                        'status'       => 'submitted',
                        'submitted_at' => now(),
                    ]);
                    Notification::make()
                        ->title('Application submitted — admin has been notified')
                        ->success()
                        ->send();
                    $this->refreshFormData(['status', 'submitted_at']);
                }),

            Actions\Action::make('recalculate')
                ->label('Refresh Progress')
                ->icon('heroicon-o-arrow-path')
                ->color('gray')
                ->tooltip('Recalculate the form completion percentage based on filled fields')
                ->action(function () {
                    $record   = $this->getRecord();
                    $progress = $record->recalculateProgress();
                    $record->update(['progress' => $progress]);
                    Notification::make()
                        ->title("Progress refreshed: {$progress}%")
                        ->success()
                        ->send();
                    $this->redirect($this->getResource()::getUrl('edit', ['record' => $record]));
                }),

            Actions\ViewAction::make(),

            Actions\DeleteAction::make()
                ->visible(fn () => auth()->user()?->hasRole(['super_admin', 'admin'])),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('edit', ['record' => $this->getRecord()]);
    }
}
