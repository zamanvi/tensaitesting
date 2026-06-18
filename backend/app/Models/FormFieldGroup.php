<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormFieldGroup extends Model
{
    protected $fillable = [
        'form_template_id', 'label', 'hint', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class, 'form_template_id');
    }

    public function boxes(): HasMany
    {
        return $this->hasMany(FormFieldBox::class, 'form_field_group_id')->orderBy('sort_order');
    }

    public function activeBoxes(): HasMany
    {
        return $this->hasMany(FormFieldBox::class, 'form_field_group_id')
            ->where('is_active', true)
            ->orderBy('sort_order');
    }

    public function fields(): HasMany
    {
        return $this->hasMany(FormTemplateField::class, 'form_field_group_id')->orderBy('sort_order');
    }

    public function activeFields(): HasMany
    {
        return $this->hasMany(FormTemplateField::class, 'form_field_group_id')
            ->where('is_active', true)
            ->orderBy('sort_order');
    }
}
