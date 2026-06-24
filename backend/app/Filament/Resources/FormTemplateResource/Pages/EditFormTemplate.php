<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use App\Models\FormFieldGroup;
use App\Models\FormTemplate;
use App\Models\FormTemplateField;
use Filament\Actions;
use Filament\Forms;
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

    protected function beforeSave(): void
    {
        $data      = $this->data;
        $currentId = $this->getRecord()->id;

        $existing = FormTemplate::where('country', $data['country'] ?? '')
            ->where('visa_type', $data['visa_type'] ?? '')
            ->where('name', $data['name'] ?? '')
            ->where('status', 'draft')
            ->where('id', '!=', $currentId)
            ->first();

        if ($existing) {
            $this->getRecord()->delete();
            Notification::make()
                ->title('A draft for this form already exists — redirected to it.')
                ->warning()
                ->send();
            $this->redirect($this->getResource()::getUrl('edit', ['record' => $existing->id]));
            throw new \Filament\Support\Exceptions\Halt();
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

    public function openEditFieldGroup(int $groupId): void
    {
        $this->mountAction('editFieldGroup', ['groupId' => $groupId]);
    }

    public function editFieldGroupAction(): Actions\Action
    {
        return Actions\Action::make('editFieldGroup')
            ->label('Edit Field Group')
            ->modalHeading('Edit Field Group')
            ->modalWidth('4xl')
            ->modalSubmitActionLabel('Save Changes')
            ->mountUsing(function (Forms\Form $form, array $arguments): void {
                $group = FormFieldGroup::with('boxes.fields')->find($arguments['groupId']);
                if (! $group) return;

                $fields = $group->boxes->flatMap(fn ($b) => $b->fields->sortBy('sort_order')->map(fn ($f) => [
                    'id'                => $f->id,
                    'label'             => $f->label,
                    'field_key'         => $f->field_key,
                    'field_type'        => $f->field_type,
                    'box_size'          => $f->box_size ?? 'middle',
                    'is_required'       => (bool) $f->is_required,
                    'placeholder'       => $f->placeholder ?? '',
                    'helper_text'       => $f->helper_text ?? '',
                    'requires_document' => (bool) $f->requires_document,
                    'document_required' => (bool) $f->document_required,
                    'options'           => $f->options ? implode(', ', $f->options) : '',
                ]))->values()->toArray();

                $form->fill([
                    'group_id'  => $group->id,
                    'label'     => $group->label,
                    'hint'      => $group->hint ?? '',
                    'is_active' => (bool) $group->is_active,
                    'fields'    => $fields,
                ]);
            })
            ->form([
                Forms\Components\Hidden::make('group_id'),

                Forms\Components\Section::make('Group Info')->schema([
                    Forms\Components\TextInput::make('label')
                        ->label('Group Title')
                        ->required()
                        ->placeholder('e.g. Personal Information'),

                    Forms\Components\Textarea::make('hint')
                        ->label('Hint / Description')
                        ->rows(2)
                        ->placeholder('Optional guidance shown below the title'),

                    Forms\Components\Toggle::make('is_active')
                        ->label('Active')
                        ->inline(false),
                ])->columns(1),

                Forms\Components\Section::make('Fields')->schema([
                    Forms\Components\Repeater::make('fields')
                        ->label('')
                        ->schema([
                            Forms\Components\Hidden::make('id'),
                            Forms\Components\Hidden::make('field_key'),

                            Forms\Components\Grid::make(3)->schema([
                                Forms\Components\TextInput::make('label')
                                    ->label('Field Label')
                                    ->required()
                                    ->columnSpan(2),

                                Forms\Components\Select::make('field_type')
                                    ->label('Type')
                                    ->options([
                                        'text'     => 'Text',
                                        'number'   => 'Number',
                                        'date'     => 'Date',
                                        'select'   => 'Dropdown',
                                        'textarea' => 'Textarea',
                                        'file'     => 'File Upload',
                                    ])
                                    ->required()
                                    ->columnSpan(1),

                                Forms\Components\Select::make('box_size')
                                    ->label('Width')
                                    ->options([
                                        'small'  => 'Small (25%)',
                                        'middle' => 'Half (50%)',
                                        'full'   => 'Full (100%)',
                                    ])
                                    ->default('middle')
                                    ->columnSpan(1),

                                Forms\Components\TextInput::make('placeholder')
                                    ->label('Placeholder')
                                    ->columnSpan(2),
                            ]),

                            Forms\Components\TextInput::make('options')
                                ->label('Options (comma separated — only for Dropdown)')
                                ->placeholder('e.g. Male, Female, Other')
                                ->visible(fn (Forms\Get $get) => $get('field_type') === 'select')
                                ->columnSpanFull(),

                            Forms\Components\TextInput::make('helper_text')
                                ->label('Helper Text')
                                ->columnSpanFull(),

                            Forms\Components\Grid::make(3)->schema([
                                Forms\Components\Toggle::make('is_required')
                                    ->label('Required')
                                    ->inline(false),

                                Forms\Components\Toggle::make('requires_document')
                                    ->label('Has Document Upload')
                                    ->inline(false),

                                Forms\Components\Toggle::make('document_required')
                                    ->label('Document Mandatory')
                                    ->inline(false),
                            ]),
                        ])
                        ->itemLabel(fn (array $state): ?string => $state['label'] ?: 'Field')
                        ->collapsible()
                        ->reorderable()
                        ->addable(false),
                ]),
            ])
            ->action(function (array $arguments, array $data): void {
                $group = FormFieldGroup::find($data['group_id']);
                if (! $group) return;

                $group->update([
                    'label'     => $data['label'],
                    'hint'      => $data['hint'] ?: null,
                    'is_active' => $data['is_active'] ?? true,
                ]);

                foreach ($data['fields'] ?? [] as $fi => $fData) {
                    if (empty($fData['id'])) continue;
                    $field = FormTemplateField::find($fData['id']);
                    if (! $field) continue;

                    $field->update([
                        'label'             => $fData['label'],
                        'field_type'        => $fData['field_type'],
                        'box_size'          => $fData['box_size'] ?? 'middle',
                        'is_required'       => $fData['is_required'] ?? false,
                        'placeholder'       => $fData['placeholder'] ?: null,
                        'helper_text'       => $fData['helper_text'] ?: null,
                        'requires_document' => $fData['requires_document'] ?? false,
                        'document_required' => $fData['document_required'] ?? false,
                        'options'           => ! empty($fData['options'])
                            ? array_map('trim', explode(',', $fData['options']))
                            : null,
                        'sort_order'        => $fi,
                    ]);
                }

                Notification::make()->title('Field group updated')->success()->send();
                $this->redirect($this->getResource()::getUrl('edit', ['record' => $this->getRecord()]));
            });
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
                        $record->update(['status' => 'draft', 'is_active' => false]);
                        Notification::make()->title('Form unpublished — moved back to draft and hidden from branches')->warning()->send();
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
        return $this->getResource()::getUrl('edit', ['record' => $this->getRecord()]);
    }
}
