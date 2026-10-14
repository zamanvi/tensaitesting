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

    // Candidate column => the CV form field that answers the same question.
    // The chat copies are only a starting point: once the person fills in My
    // CV, the CV answer is the current one and the staff list must show it.
    public const CV_FIELDS = [
        'role'           => 'desired_job',
        'experience'     => 'experience',
        'licence'        => 'licence_type',
        'languages'      => 'languages',
        'target_country' => 'target_country',
        'district'       => 'district',
        'has_passport'   => 'has_passport',
        'can_visit_office' => 'can_visit_office',
    ];

    private function cvAnswer(string $field): ?string
    {
        $key  = self::CV_FIELDS[$field] ?? null;
        $data = $this->cvAccess?->application?->form_data;
        if (! $key || ! is_array($data)) {
            return null;
        }

        $value = $data[$key] ?? null;
        $value = is_scalar($value) ? trim((string) $value) : '';

        return $value !== '' ? $value : null;
    }

    // Text answer: the CV wins, then what the chat collected.
    public function currentValue(string $field): ?string
    {
        $chat = $this->getAttribute($field);

        return $this->cvAnswer($field) ?? (is_string($chat) && trim($chat) !== '' ? $chat : null);
    }

    // Yes/No answer as true / false, or null when nobody asked yet. CV answers
    // are stored as "Yes / হ্যাঁ" and "No / না".
    public function currentFlag(string $field): ?bool
    {
        $cv = $this->cvAnswer($field);
        if ($cv !== null) {
            $lower = mb_strtolower($cv);
            if (str_starts_with($lower, 'yes') || str_starts_with($lower, 'হ্যাঁ')) {
                return true;
            }
            if (str_starts_with($lower, 'no') || str_starts_with($lower, 'না')) {
                return false;
            }
        }

        $chat = $this->getAttribute($field);

        return $chat === null ? null : (bool) $chat;
    }
}
