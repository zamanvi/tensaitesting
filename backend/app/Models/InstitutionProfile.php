<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstitutionProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'institution_name', 'institution_name_local', 'institution_type',
        'country', 'city', 'address', 'website', 'logo', 'description',
        'intake_months', 'accepted_qualifications', 'required_language_scores',
        'tuition_fee_min', 'tuition_fee_max', 'currency',
        'commission_percent', 'status', 'verified_at',
    ];

    protected $casts = [
        'intake_months' => 'array',
        'accepted_qualifications' => 'array',
        'required_language_scores' => 'array',
        'tuition_fee_min' => 'decimal:2',
        'tuition_fee_max' => 'decimal:2',
        'commission_percent' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function isActive(): bool { return $this->status === 'active'; }
}
