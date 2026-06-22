<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormTemplate extends Model
{
    protected $fillable = [
        'country', 'visa_type', 'name', 'intake_options', 'birth_date',
        'student_name', 'passport_no', 'education',
        'is_active', 'status', 'notes',
    ];

    protected $casts = [
        'intake_options' => 'array',
        'is_active'      => 'boolean',
    ];

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function fieldGroups(): HasMany
    {
        return $this->hasMany(FormFieldGroup::class)->orderBy('sort_order');
    }

    public function fieldGroupsCount(): HasMany
    {
        return $this->hasMany(FormFieldGroup::class);
    }

    public function activeFieldGroups(): HasMany
    {
        return $this->hasMany(FormFieldGroup::class)
            ->where('is_active', true)
            ->orderBy('sort_order');
    }

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
