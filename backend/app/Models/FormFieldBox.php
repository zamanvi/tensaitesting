<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormFieldBox extends Model
{
    protected $fillable = [
        'form_field_group_id', 'name', 'requires_document', 'document_required',
        'doc_label', 'doc_key', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'requires_document'  => 'boolean',
        'document_required'  => 'boolean',
        'is_active'          => 'boolean',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(FormFieldGroup::class, 'form_field_group_id');
    }

    public function fields(): HasMany
    {
        return $this->hasMany(FormTemplateField::class, 'form_field_box_id')->orderBy('sort_order');
    }

    public function activeFields(): HasMany
    {
        return $this->hasMany(FormTemplateField::class, 'form_field_box_id')
            ->where('is_active', true)
            ->orderBy('sort_order');
    }
}
