<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AffiliateManagedEntity extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'affiliate_managed_entities';

    protected $fillable = [
        'affiliate_user_id',
        'entity_type',
        'name',
        'contact_email',
        'contact_phone',
        'website',
        'country',
        'city',
        'specialty',
        'capacity',
        'designation',
        'linked_user_id',
        'status',
        'commission_percent',
        'notes',
    ];

    protected $casts = [
        'commission_percent'  => 'decimal:2',
        'total_enrollments'   => 'integer',
        'total_earned'        => 'decimal:2',
        'capacity'            => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function affiliateUser()
    {
        return $this->belongsTo(User::class, 'affiliate_user_id');
    }

    public function linkedUser()
    {
        return $this->belongsTo(User::class, 'linked_user_id');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeInstitutions($query)
    {
        return $query->where('entity_type', 'institution');
    }

    public function scopeEmployees($query)
    {
        return $query->where('entity_type', 'employee');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
