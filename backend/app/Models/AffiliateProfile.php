<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AffiliateProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'tier', 'country', 'bio',
        'bank_name', 'bank_account_number', 'bank_account_name',
        'bkash_number', 'nagad_number',
        'total_referrals', 'converted_referrals', 'total_earned',
        'pending_payout', 'commission_percent', 'status',
    ];

    protected $casts = [
        'total_earned' => 'decimal:2',
        'pending_payout' => 'decimal:2',
        'commission_percent' => 'decimal:2',
        'total_referrals' => 'integer',
        'converted_referrals' => 'integer',
    ];

    public function user() { return $this->belongsTo(User::class); }

    public function isGlobalPartner(): bool { return $this->tier === 'global_partner'; }

    public function conversionRate(): float
    {
        if ($this->total_referrals === 0) return 0;
        return round(($this->converted_referrals / $this->total_referrals) * 100, 1);
    }
}
