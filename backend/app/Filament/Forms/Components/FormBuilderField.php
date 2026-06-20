<?php

namespace App\Filament\Forms\Components;

use App\Models\FormFieldGroup;
use Filament\Forms\Components\Field;

class FormBuilderField extends Field
{
    protected string $view = 'filament.forms.components.form-builder';

    protected function setUp(): void
    {
        parent::setUp();

        $this->default('[]');
        $this->dehydrated(false);

        $this->afterStateHydrated(function (FormBuilderField $component) {
            $record = $component->getRecord();

            if (! $record || ! $record->exists) {
                $component->state('[]');
                return;
            }

            $groups = FormFieldGroup::with(['boxes.fields'])
                ->where('form_template_id', $record->id)
                ->orderBy('sort_order')
                ->get();

            if ($groups->isEmpty()) {
                $component->state('[]');
                return;
            }

            $structure = $groups->map(function ($group) {
                return [
                    'id'         => $group->id,
                    'label'      => $group->label ?? '',
                    'is_active'  => $group->is_active,
                    'sort_order' => $group->sort_order,
                    'boxes'      => $group->boxes->map(function ($box) {
                        $docMode = 'none';
                        if ($box->document_required) $docMode = 'mandatory';
                        elseif ($box->requires_document) $docMode = 'optional';

                        return [
                            'id'                => $box->id,
                            'name'              => $box->name ?? '',
                            'is_active'         => $box->is_active,
                            'requires_document' => $box->requires_document,
                            'document_required' => $box->document_required ?? false,
                            'doc_mode'          => $docMode,
                            'doc_label'         => $box->doc_label ?? '',
                            'doc_key'           => $box->doc_key ?? '',
                            'sort_order'        => $box->sort_order,
                            'fields'            => $box->fields->map(function ($field) {
                                $docMode = 'none';
                                if ($field->document_required) $docMode = 'mandatory';
                                elseif ($field->requires_document) $docMode = 'optional';

                                return [
                                    'field_id'              => $field->id,
                                    'label'                 => $field->label ?? '',
                                    'field_key'             => $field->field_key ?? '',
                                    'field_type'            => $field->field_type ?? 'text',
                                    'box_size'              => $field->box_size ?? 'middle',
                                    'is_required'           => $field->is_required,
                                    'is_active'             => $field->is_active,
                                    'requires_document'     => $field->requires_document,
                                    'document_required'     => $field->document_required ?? false,
                                    'document_mode'         => $docMode,
                                    'placeholder'           => $field->placeholder ?? '',
                                    'helper_text'           => $field->helper_text ?? '',
                                    'options'               => $field->options ?? [],
                                    'sort_order'            => $field->sort_order,
                                    'conditional_field_key' => $field->conditional_field_key ?? '',
                                    'conditional_operator'  => $field->conditional_operator ?? '',
                                    'conditional_value'     => $field->conditional_value ?? '',
                                ];
                            })->values()->toArray(),
                        ];
                    })->values()->toArray(),
                ];
            })->values()->toArray();

            $component->state(json_encode($structure));
        });
    }
}
