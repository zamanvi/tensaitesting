<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;

class User extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, SoftDeletes;

    protected $fillable = [
        'name', 'email', 'phone', 'password',
        'gateway_type', 'status', 'avatar',
        'affiliate_code', 'referred_by',
        'email_verification_code', 'email_verification_expires_at',
        'branch_id', 'manager_sections', 'manager_plain_password',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at'  => 'datetime',
        'phone_verified_at'  => 'datetime',
        'password'           => 'hashed',
        'manager_sections'   => 'array',
    ];

    public function canAccessPanel(Panel $panel): bool
    {
        if ($panel->getId() === 'manager') {
            return $this->hasRole('manager');
        }
        return $this->hasRole(['admin', 'super_admin', 'branch_admin', 'branch_manager']);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function agencyProfile()
    {
        return $this->hasOne(AgencyProfile::class);
    }

    public function institutionProfile()
    {
        return $this->hasOne(InstitutionProfile::class);
    }

    public function affiliateProfile()
    {
        return $this->hasOne(AffiliateProfile::class);
    }

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function referrals()
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    public function leadsAsStudent()
    {
        return $this->hasMany(Lead::class, 'student_id');
    }

    public function leadsAsSourceAgency()
    {
        return $this->hasMany(Lead::class, 'source_agency_id');
    }

    public function leadsAsAssignedAgency()
    {
        return $this->hasMany(Lead::class, 'assigned_agency_id');
    }

    public function tensaiNotifications()
    {
        return $this->hasMany(TensaiNotification::class);
    }

    public function isStudent(): bool { return $this->gateway_type === 'student'; }
    public function isAgency(): bool { return $this->gateway_type === 'agency'; }
    public function isInstitution(): bool { return $this->gateway_type === 'institution'; }
    public function isAffiliate(): bool { return $this->gateway_type === 'affiliate'; }
    public function isActive(): bool { return $this->status === 'active'; }
}
