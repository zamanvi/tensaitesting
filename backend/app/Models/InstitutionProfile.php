<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Lead;
use App\Models\Interview;

class InstitutionProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'institution_name', 'institution_name_local', 'institution_type',
        'country', 'city', 'address', 'website', 'logo', 'description',
        'intake_months', 'accepted_qualifications', 'required_language_scores',
        'tuition_fee_min', 'tuition_fee_max', 'currency',
        'commission_percent', 'status', 'verified_at', 'admin_notes',
    ];

    protected $appends = ['logo_url'];

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
    public function leads() { return $this->hasMany(Lead::class, 'assigned_institution_id', 'user_id'); }
    public function interviews() { return $this->hasMany(Interview::class, 'institution_id', 'user_id'); }
    public function isActive(): bool { return $this->status === 'active'; }

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo) return null;
        $disk = app()->environment('production') ? 'r2' : 'public';
        return \Illuminate\Support\Facades\Storage::disk($disk)->url($this->logo);
    }
}
