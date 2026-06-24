<?php

namespace App\Filament\Resources\FormFieldGroupResource\Pages;

use App\Filament\Resources\FormFieldGroupResource;
use App\Filament\Resources\FormTemplateResource;
use App\Models\FormFieldBox;
use App\Models\FormTemplateField;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Str;

class EditFormFieldGroup extends EditRecord
{
    protected static string $resource = FormFieldGroupResource::class;

    public function getTitle(): string
    {
        return 'Edit Section — ' . ($this->getRecord()->label ?: 'Untitled');
    }

    // Load existing fields into the repeater
    protected function mutateFormDataBeforeFill(array $data): array
    {
        $group = $this->getRecord()->load('boxes.fields');

        $data['fields_data'] = $group->boxes
            ->flatMap(fn ($b) => $b->fields->sortBy('sort_order')->map(fn ($f) => [
                'id'                => $f->id,
                'label'             => $f->label,
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

        return $data;
    }

    // Save group + fields
    protected function mutateFormDataBeforeSave(array $data): array
    {
        $group = $this->getRecord();

        // Get or create a box
        $box = $group->boxes()->first()
            ?? FormFieldBox::create([
                'form_field_group_id' => $group->id,
                'name'                => '',
                'sort_order'          => 0,
                'is_active'           => true,
            ]);

        foreach ($data['fields_data'] ?? [] as $fi => $fData) {
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

        // Preserve label for Application Form Info (title is fixed)
        $label = $this->getRecord()->label === 'Application Form Info'
            ? 'Application Form Info'
            : $data['label'];

        return [
            'label'     => $label,
            'hint'      => $data['hint'] ?: null,
            'is_active' => $data['is_active'] ?? true,
        ];
    }

    protected function getRedirectUrl(): string
    {
        return FormTemplateResource::getUrl('edit', ['record' => $this->getRecord()->form_template_id]);
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'Section saved';
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
