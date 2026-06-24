<?php

namespace App\Filament\Resources\FormTemplateResource\Pages;

use App\Filament\Resources\FormTemplateResource;
use App\Models\FormFieldBox;
use App\Models\FormFieldGroup;
use App\Models\FormTemplate;
use App\Models\FormTemplateField;
use Illuminate\Support\Str;
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
            $this->dispatch('auto-open-preview');
        }
    }

    protected function getFooterWidgets(): array
    {
        return [];
    }

    protected function getExtraBodyAttributes(): array
    {
        if (request()->query('preview') === '1') {
            return ['x-init' => '$nextTick(() => $wire.mountAction(\'preview\'))'];
        }
        return [];
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
        // Sync form builder structure only (no group auto-creation here)
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

    // Called by "Save Info" button — saves template AND ensures group exists once
    public function saveInfoSection(): void
    {
        $this->save();

        $this->getRecord()->fieldGroups()->firstOrCreate(
            ['label' => 'Application Form Info'],
            ['sort_order' => 0, 'is_active' => true]
        );

        $this->redirect($this->getResource()::getUrl('edit', ['record' => $this->getRecord()]));
    }

    // Inline group editing state
    public ?int   $inlineEditGroupId    = null;
    public string $inlineEditLabel      = '';
    public string $inlineEditHint       = '';
    public bool   $inlineEditIsActive   = true;
    public array  $inlineEditFields     = [];

    // Inline field-level editing
    public ?int  $inlineEditFieldId   = null;
    public array $inlineEditFieldData = [];

    public function openEditFieldGroup(int $groupId): void
    {
        $group = FormFieldGroup::with('boxes.fields')->find($groupId);
        if (! $group) return;

        $this->inlineEditGroupId  = $groupId;
        $this->inlineEditLabel    = $group->label ?? '';
        $this->inlineEditHint     = $group->hint  ?? '';
        $this->inlineEditIsActive = (bool) $group->is_active;
        $this->inlineEditFields   = $group->boxes
            ->flatMap(fn ($b) => $b->fields->sortBy('sort_order')->map(fn ($f) => [
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
            ]))
            ->values()
            ->toArray();
    }

    public function cancelInlineEdit(): void
    {
        $this->inlineEditGroupId = null;
        $this->inlineEditFields  = [];
    }

    public function addInlineField(): void
    {
        $this->inlineEditFields[] = [
            'id'                => null,
            'label'             => '',
            'field_key'         => '',
            'field_type'        => 'text',
            'box_size'          => 'middle',
            'is_required'       => false,
            'placeholder'       => '',
            'helper_text'       => '',
            'requires_document' => false,
            'document_required' => false,
            'options'           => '',
        ];
    }

    public function removeInlineField(int $index): void
    {
        $field = $this->inlineEditFields[$index] ?? null;
        if ($field && ! empty($field['id'])) {
            FormTemplateField::find($field['id'])?->delete();
        }
        array_splice($this->inlineEditFields, $index, 1);
    }

    public function saveInlineGroup(): void
    {
        $group = FormFieldGroup::find($this->inlineEditGroupId);
        if (! $group) return;

        $group->update([
            'label'     => $this->inlineEditLabel,
            'hint'      => $this->inlineEditHint ?: null,
            'is_active' => $this->inlineEditIsActive,
        ]);

        $box = $group->boxes()->first()
            ?? FormFieldBox::create([
                'form_field_group_id' => $group->id,
                'name'       => '',
                'sort_order' => 0,
                'is_active'  => true,
            ]);

        foreach ($this->inlineEditFields as $fi => $fData) {
            $attrs = [
                'form_template_id'    => $group->form_template_id,
                'form_field_group_id' => $group->id,
                'form_field_box_id'   => $box->id,
                'label'               => $fData['label'],
                'field_type'          => $fData['field_type'] ?? 'text',
                'box_size'            => $fData['box_size'] ?? 'middle',
                'is_required'         => $fData['is_required'] ?? false,
                'is_active'           => true,
                'placeholder'         => $fData['placeholder'] ?: null,
                'helper_text'         => $fData['helper_text'] ?: null,
                'requires_document'   => $fData['requires_document'] ?? false,
                'document_required'   => $fData['document_required'] ?? false,
                'options'             => ! empty($fData['options'])
                    ? array_map('trim', explode(',', $fData['options']))
                    : null,
                'sort_order'          => $fi,
            ];

            if (! empty($fData['id']) && $field = FormTemplateField::find($fData['id'])) {
                $field->update($attrs);
            } else {
                $base = Str::snake($fData['label'] ?? '') ?: 'field';
                        $attrs['field_key'] = $base . '_' . uniqid();
                FormTemplateField::create($attrs);
            }
        }

        $this->inlineEditGroupId = null;
        $this->inlineEditFields  = [];
        Notification::make()->title('Section saved')->success()->send();
    }

    public function openEditField(int $fieldId): void
    {
        $field = FormTemplateField::find($fieldId);
        if (! $field) return;

        $this->inlineEditFieldId   = $fieldId;
        $this->inlineEditFieldData = [
            'label'             => $field->label,
            'field_type'        => $field->field_type,
            'box_size'          => $field->box_size ?? 'middle',
            'is_required'       => (bool) $field->is_required,
            'placeholder'       => $field->placeholder ?? '',
            'helper_text'       => $field->helper_text ?? '',
            'requires_document' => (bool) $field->requires_document,
            'document_required' => (bool) $field->document_required,
            'options'           => $field->options ? implode(', ', $field->options) : '',
        ];
    }

    public function cancelEditField(): void
    {
        $this->inlineEditFieldId   = null;
        $this->inlineEditFieldData = [];
    }

    public function saveInlineField(): void
    {
        $field = FormTemplateField::find($this->inlineEditFieldId);
        if (! $field) return;

        $d = $this->inlineEditFieldData;
        $field->update([
            'label'             => $d['label'],
            'field_type'        => $d['field_type'] ?? 'text',
            'box_size'          => $d['box_size'] ?? 'middle',
            'is_required'       => $d['is_required'] ?? false,
            'placeholder'       => $d['placeholder'] ?: null,
            'helper_text'       => $d['helper_text'] ?: null,
            'requires_document' => $d['requires_document'] ?? false,
            'document_required' => $d['document_required'] ?? false,
            'options'           => ! empty($d['options'])
                ? array_map('trim', explode(',', $d['options']))
                : null,
        ]);

        $this->inlineEditFieldId   = null;
        $this->inlineEditFieldData = [];
        Notification::make()->title('Field saved')->success()->send();
        $this->redirect($this->getResource()::getUrl('edit', ['record' => $this->getRecord()]));
    }

    public function deleteField(int $fieldId): void
    {
        FormTemplateField::find($fieldId)?->delete();
        $this->redirect($this->getResource()::getUrl('edit', ['record' => $this->getRecord()]));
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
