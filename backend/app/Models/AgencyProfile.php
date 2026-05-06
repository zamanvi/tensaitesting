<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgencyProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'agency_name', 'agency_name_bn', 'registration_number',
        'trade_license', 'trade_license_document', 'contact_person_name',
        'contact_person_phone', 'address', 'city', 'website', 'description',
        'logo', 'vetting_status', 'slot_number', 'rejection_reason',
        'approved_at', 'approved_by', 'target_countries', 'service_types',
    ];

    protected $casts = [
        'target_countries' => 'array',
        'service_types' => 'array',
        'approved_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function approvedBy() { return $this->belongsTo(User::class, 'approved_by'); }

    public function isApproved(): bool { return $this->vetting_status === 'approved'; }
}
