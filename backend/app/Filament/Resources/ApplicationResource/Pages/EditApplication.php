<?php

namespace App\Filament\Resources\ApplicationResource\Pages;

use App\Filament\Resources\ApplicationResource;
use App\Models\Application;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

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
        $record   = $this->getRecord();
        $progress = $record->recalculateProgress();
        $record->update(['progress' => $progress]);
    }

    protected function getHeaderActions(): array
    {
        $record = $this->getRecord();

        return [
            // Progress badge — always visible
            Actions\Action::make('progress_indicator')
                ->label(fn () => 'Progress: ' . $this->getRecord()->progress . '%')
                ->color(fn () => $this->getRecord()->progress >= 80 ? 'success'
                    : ($this->getRecord()->progress >= 50 ? 'warning' : 'danger'))
                ->icon(fn () => $this->getRecord()->progress >= 50
                    ? 'heroicon-o-check-circle' : 'heroicon-o-clock')
                ->disabled()
                ->extraAttributes(['style' => 'cursor:default;pointer-events:none;']),

            // Submit — only when progress ≥ 50%
            Actions\Action::make('submit_application')
                ->label(fn () => $this->getRecord()->status === 'submitted' ? 'Resubmit' : 'Submit Application')
                ->icon('heroicon-o-paper-airplane')
                ->color('success')
                ->visible(fn () => $this->getRecord()->progress >= 50)
                ->requiresConfirmation()
                ->modalHeading('Submit this application?')
                ->modalDescription('The application will be marked as submitted and visible to all admins.')
                ->action(function () {
                    $this->getRecord()->update([
                        'status'       => 'submitted',
                        'submitted_at' => now(),
                    ]);
                    Notification::make()
                        ->title('Application submitted successfully')
                        ->success()
                        ->send();
                    $this->refreshFormData(['status', 'submitted_at']);
                }),

            Actions\Action::make('view_progress')
                ->label('Recalculate Progress')
                ->icon('heroicon-o-arrow-path')
                ->color('gray')
                ->action(function () {
                    $record   = $this->getRecord();
                    $progress = $record->recalculateProgress();
                    $record->update(['progress' => $progress]);
                    Notification::make()
                        ->title("Progress updated: {$progress}%")
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
