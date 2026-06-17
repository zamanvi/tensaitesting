<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormTemplateField extends Model
{
    protected $fillable = [
        'form_template_id', 'field_key', 'label', 'section',
        'field_type', 'is_required', 'is_active', 'requires_document',
        'options', 'placeholder', 'helper_text', 'sort_order',
    ];

    protected $casts = [
        'options'     => 'array',
        'is_required'        => 'boolean',
        'is_active'          => 'boolean',
        'requires_document'  => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }
}
