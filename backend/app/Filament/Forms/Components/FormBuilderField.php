<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;

class FormBuilderField extends Field
{
    protected string $view = 'filament.forms.components.form-builder';

    protected function setUp(): void
    {
        parent::setUp();

        $this->default('[]');

        $this->dehydrated(false);

        $this->afterStateHydrated(function (FormBuilderField $component, $record) {
            if (! $record) {
                $component->state('[]');
                return;
            }

            $record->load('fieldGroups.boxes.fields');

            $structure = $record->fieldGroups->map(function ($g) {
                return [
                    'id'         => $g->id,
                    'label'      => $g->label ?? '',
                    'is_active'  => (bool) $g->is_active,
                    'sort_order' => $g->sort_order,
                    'boxes'      => $g->boxes->map(function ($b) {
                        return [
                            'id'                => $b->id,
                            'name'              => $b->name ?? '',
                            'requires_document' => (bool) $b->requires_document,
                            'is_active'         => (bool) $b->is_active,
                            'sort_order'        => $b->sort_order,
                            'fields'            => $b->fields->map(function ($f) {
                                return [
                                    'id'                    => $f->id,
                                    'label'                 => $f->label ?? '',
                                    'field_key'             => $f->field_key ?? '',
                                    'field_type'            => $f->field_type ?? 'text',
                                    'box_size'              => $f->box_size ?? 'middle',
                                    'is_required'           => (bool) $f->is_required,
                                    'is_active'             => (bool) $f->is_active,
                                    'placeholder'           => $f->placeholder ?? '',
                                    'helper_text'           => $f->helper_text ?? '',
                                    'options'               => $f->options ?? [],
                                    'sort_order'            => $f->sort_order,
                                    'conditional_field_key' => $f->conditional_field_key ?? '',
                                    'conditional_operator'  => $f->conditional_operator ?? '',
                                    'conditional_value'     => $f->conditional_value ?? '',
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
