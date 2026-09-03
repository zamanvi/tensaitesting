<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentCategory extends Model
{
    protected $fillable = [
        'key', 'label', 'fund_target', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function fundsBranch(): bool
    {
        return $this->fund_target === 'branch';
    }

    public function fundsHeadOffice(): bool
    {
        return $this->fund_target === 'head_office';
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
