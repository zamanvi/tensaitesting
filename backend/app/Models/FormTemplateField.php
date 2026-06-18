<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

class FormTemplateField extends Model
{
    protected $fillable = [
        'form_template_id', 'form_field_group_id', 'form_field_box_id', 'field_key', 'label', 'section',
        'field_type', 'is_required', 'is_active', 'requires_document', 'document_required',
        'options', 'placeholder', 'helper_text', 'sort_order',
        'box_size', 'conditional_field_key', 'conditional_operator', 'conditional_value',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $field) {
            if ($field->form_field_box_id && ! $field->form_template_id) {
                try {
                    $field->form_template_id = $field->box->group->form_template_id;
                    $field->form_field_group_id = $field->box->form_field_group_id;
                } catch (\Throwable $e) {
                    Log::warning('FormTemplateField: could not auto-fill template/group id', ['box_id' => $field->form_field_box_id]);
                }
            }
        });
    }

    protected $casts = [
        'options'     => 'array',
        'is_required'        => 'boolean',
        'is_active'          => 'boolean',
        'requires_document'   => 'boolean',
        'document_required'   => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(FormFieldGroup::class, 'form_field_group_id');
    }

    public function box(): BelongsTo
    {
        return $this->belongsTo(FormFieldBox::class, 'form_field_box_id');
    }
}
