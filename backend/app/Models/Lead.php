<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'lead_code', 'student_id', 'pool_type',
        'source_agency_id', 'assigned_agency_id', 'assigned_institution_id',
        'affiliate_id', 'status', 'is_published', 'published_at',
        'unlock_fee', 'is_locked', 'target_country', 'target_course',
        'target_intake', 'admin_notes', 'agency_notes',
        'forwarded_from_agency_id', 'referral_fee', 'referral_fee_paid',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_locked' => 'boolean',
        'referral_fee_paid' => 'boolean',
        'target_intake' => 'date',
        'published_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Lead $lead) {
            $lead->lead_code = 'TEN-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5));
        });
    }

    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function sourceAgency() { return $this->belongsTo(User::class, 'source_agency_id'); }
    public function assignedAgency() { return $this->belongsTo(User::class, 'assigned_agency_id'); }
    public function assignedInstitution() { return $this->belongsTo(User::class, 'assigned_institution_id'); }
    public function affiliate() { return $this->belongsTo(User::class, 'affiliate_id'); }
    public function interviews() { return $this->hasMany(Interview::class); }
    public function commissions() { return $this->hasMany(Commission::class); }
    public function contactPapers() { return $this->hasMany(ContactPaper::class); }

    public function isOpenPool(): bool { return $this->pool_type === 'open'; }

    public function publishToOpenPool(): void
    {
        $this->update([
            'pool_type' => 'open',
            'is_published' => true,
            'published_at' => now(),
        ]);
    }
}
