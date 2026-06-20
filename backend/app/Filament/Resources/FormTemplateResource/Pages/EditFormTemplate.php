<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use App\Models\Application;
use App\Models\FormFieldGroup;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

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
            Actions\Action::make('submit_application')
                ->label('Submit Application')
                ->icon('heroicon-o-paper-airplane')
                ->color('success')
                ->modalHeading('Submit Application for This Form')
                ->modalDescription('Create and submit an application using this form template.')
                ->modalWidth('lg')
                ->form([
                    Forms\Components\TextInput::make('student_name')
                        ->label('Student Name')
                        ->required()
                        ->maxLength(255),

                    Forms\Components\TextInput::make('student_email')
                        ->label('Student Email')
                        ->email()
                        ->maxLength(255),

                    Forms\Components\TextInput::make('student_phone')
                        ->label('Student Phone')
                        ->tel()
                        ->maxLength(50),
                ])
                ->action(function (array $data): void {
                    $template = $this->getRecord();

                    $app = Application::create([
                        'form_template_id'  => $template->id,
                        'user_id'           => auth()->id(),
                        'submitted_by_role' => 'admin',
                        'student_name'      => $data['student_name'],
                        'student_email'     => $data['student_email'] ?? null,
                        'student_phone'     => $data['student_phone'] ?? null,
                        'form_data'         => [],
                        'progress'          => 0,
                        'status'            => 'submitted',
                        'submitted_at'      => now(),
                    ]);

                    Notification::make()
                        ->title("Application {$app->application_code} submitted successfully")
                        ->success()
                        ->send();
                }),

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
