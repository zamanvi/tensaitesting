<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

// A skilled worker (driver, caregiver, technician …) who answered the
// Skilled Worker Mobility chat. See the create_mobility_candidates migration
// for what is — and deliberately is not — stored.
class MobilityCandidate extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUSES = [
        'new'           => 'New',
        'contacted'     => 'Contacted',
        'verified'      => 'Documents verified',
        'passport_ready' => 'Talent Passport ready',
        'closed'        => 'Closed',
    ];

    protected $fillable = [
        'code', 'status', 'source', 'lang',
        'full_name', 'phone', 'email', 'phone_consent', 'consented_at',
        'role', 'experience', 'licence', 'languages', 'target_country', 'answers',
        'has_passport', 'can_visit_office', 'district',
        'summary', 'video_url', 'passport_published', 'branch_id', 'admin_notes',
        'ip_hash',
    ];

    protected $casts = [
        'answers'            => 'array',
        'phone_consent'      => 'boolean',
        'has_passport'       => 'boolean',
        'can_visit_office'   => 'boolean',
        'passport_published' => 'boolean',
        'consented_at'       => 'datetime',
    ];

    // Never leaves the server in a JSON response.
    protected $hidden = ['ip_hash', 'email'];

    protected static function booted(): void
    {
        static::creating(function (MobilityCandidate $candidate) {
            if (!$candidate->code) {
                $candidate->code = static::newCode();
            }
        });
    }

    // 8 characters from an alphabet without 0/O/1/I, so a code read out over
    // the phone or typed from a printed QR can't be misheard or mistyped.
    public static function newCode(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        do {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (static::withTrashed()->where('code', $code)->exists());

        return $code;
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    // Set when staff opened My CV for this person's account.
    public function cvAccess()
    {
        return $this->hasOne(CvAccess::class, 'mobility_candidate_id');
    }
}
