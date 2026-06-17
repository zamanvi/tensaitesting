<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormTemplate extends Model
{
    protected $fillable = [
        'country', 'name', 'intake_options', 'is_active', 'notes',
    ];

    protected $casts = [
        'intake_options' => 'array',
        'is_active'      => 'boolean',
    ];

    public function fields(): HasMany
    {
        return $this->hasMany(FormTemplateField::class)->orderBy('sort_order');
    }

    public function activeFields(): HasMany
    {
        return $this->hasMany(FormTemplateField::class)
            ->where('is_active', true)
            ->orderBy('sort_order');
    }
}
