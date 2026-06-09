<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'affiliate_type',       // local | global
        'tier',
        'type_confirmed',

        // Global affiliate extras
        'organization_name',
        'designation',
        'website',
        'target_regions',
        'performance_level',

        // Common profile
        'country', 'bio',

        // Payout
        'bank_name', 'bank_account_number', 'bank_account_name',
        'bkash_number', 'nagad_number',

        // Status
        'status',

        // Commission rates (set by admin)
        'local_commission_fixed',
        'global_commission_percent',
        'commission_percent',

        // Denormalized counters (updated by syncEntityCounts)
        'total_earned',
        'pending_payout',
        'total_referrals',
        'converted_referrals',
        'managed_institutions_count',
        'managed_employees_count',
    ];

    protected $casts = [
        'total_earned'               => 'decimal:2',
        'pending_payout'             => 'decimal:2',
        'commission_percent'         => 'decimal:2',
        'local_commission_fixed'     => 'decimal:2',
        'global_commission_percent'  => 'decimal:2',
        'total_referrals'            => 'integer',
        'converted_referrals'        => 'integer',
        'managed_institutions_count' => 'integer',
        'managed_employees_count'    => 'integer',
        'type_confirmed'             => 'boolean',
        'target_regions'             => 'array',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function managedEntities()
    {
        return $this->hasMany(AffiliateManagedEntity::class, 'affiliate_user_id', 'user_id');
    }

    public function managedInstitutions()
    {
        return $this->hasMany(AffiliateManagedEntity::class, 'affiliate_user_id', 'user_id')
            ->where('entity_type', 'institution');
    }

    public function managedEmployees()
    {
        return $this->hasMany(AffiliateManagedEntity::class, 'affiliate_user_id', 'user_id')
            ->where('entity_type', 'employee');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isLocal(): bool  { return $this->affiliate_type === 'local'; }
    public function isGlobal(): bool { return $this->affiliate_type === 'global'; }

    public function conversionRate(): float
    {
        if ($this->total_referrals === 0) return 0;
        return round(($this->converted_referrals / $this->total_referrals) * 100, 1);
    }

    public function performanceBadge(): array
    {
        return match ($this->performance_level) {
            'platinum' => ['label' => 'Platinum', 'color' => '#6366f1'],
            'gold'     => ['label' => 'Gold',     'color' => '#f59e0b'],
            'silver'   => ['label' => 'Silver',   'color' => '#64748b'],
            default    => ['label' => 'Bronze',   'color' => '#b45309'],
        };
    }
}
