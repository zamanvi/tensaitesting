<?php

namespace App\Models;

use App\Support\JobCvTemplate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// "Staff opened My CV for this account." See the create_cv_accesses migration.
class CvAccess extends Model
{
    public const STATUSES = ['active' => 'Active', 'paused' => 'Paused'];

    public const STAGES = [
        'filling' => 'Filling the CV',
        'review'  => 'Ready for review',
        // Internal key stays "sent" (the My CV page and API use it); staff see "Approved".
        'sent'    => 'Approved',
    ];

    protected $fillable = [
        'user_id', 'mobility_candidate_id', 'application_id', 'status',
        'activated_by', 'activated_at',
        'share_consent_at', 'cv_submitted_at', 'sent_at',
        'ai_messages_used', 'ai_messages_limit', 'chat_log',
        'public_token', 'public_enabled', 'admin_notes',
    ];

    protected $casts = [
        'activated_at'      => 'datetime',
        'share_consent_at'  => 'datetime',
        'cv_submitted_at'   => 'datetime',
        'sent_at'           => 'datetime',
        'chat_log'          => 'array',
        'public_enabled'    => 'boolean',
        'ai_messages_used'  => 'integer',
        'ai_messages_limit' => 'integer',
    ];

    // Never leaves the server inside a model->toArray().
    protected $hidden = ['chat_log', 'admin_notes'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(MobilityCandidate::class, 'mobility_candidate_id');
    }

    public function activator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'activated_by');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    // The link may only be switched on after the person agreed to share.
    public function canShare(): bool
    {
        return $this->isActive() && $this->share_consent_at !== null;
    }

    public function publicLinkIsLive(): bool
    {
        return $this->public_enabled && $this->public_token && $this->canShare();
    }

    public function publicUrl(): ?string
    {
        return $this->public_token
            ? rtrim((string) config('app.frontend_url', 'https://www.tensaiconsultancy.com'), '/') . '/cv/' . $this->public_token
            : null;
    }

    public function stage(): string
    {
        if ($this->sent_at) {
            return 'sent';
        }

        return $this->cv_submitted_at ? 'review' : 'filling';
    }

    // Labels of required Job CV fields that are still empty. Empty list = the
    // CV can be sent for review.
    public function missingRequired(): array
    {
        $application = $this->application;
        if (! $application) {
            return ['CV'];
        }

        $template = FormTemplate::with('activeFieldGroups.activeBoxes.activeFields')
            ->find($application->form_template_id);

        $data    = $application->form_data ?? [];
        $missing = [];

        foreach ($template?->activeFieldGroups ?? [] as $group) {
            foreach ($group->activeBoxes as $box) {
                foreach ($box->activeFields as $field) {
                    if (! $field->is_required || $field->field_type === 'file') {
                        continue;
                    }
                    $value = $data[$field->field_key] ?? null;
                    if ($value === null || trim((string) $value) === '') {
                        $missing[] = $field->label;
                    }
                }
            }
        }

        return $missing;
    }

    // The person finished their CV and asked staff to review it.
    public function submitForReview(): void
    {
        $this->forceFill([
            'share_consent_at' => $this->share_consent_at ?: now(),
            'cv_submitted_at'  => now(),
        ])->save();
    }

    public function isApproved(): bool
    {
        return $this->sent_at !== null;
    }

    // Staff checked the CV and approved it: it now lists under Approved CVs.
    // Employers do NOT see it from here — that is a separate, later step.
    // (The database column is still called sent_at.) Safe to call twice: the
    // person is told once.
    public function approve(): void
    {
        DB::transaction(function () {
            $first = $this->sent_at === null;

            $this->forceFill(['sent_at' => $this->sent_at ?: now()])->save();

            $application = $this->application;
            if ($application && $application->status === 'draft') {
                $application->forceFill(['status' => 'submitted', 'submitted_at' => now()])->save();
            }

            if ($first) {
                // The person sees this in their bell.
                TensaiNotification::create([
                    'user_id'    => $this->user_id,
                    'type'       => 'cv_checked',
                    'title'      => 'Your CV has been checked',
                    'body'       => 'Our team checked your CV and added it to our list.',
                    'data'       => ['application_id' => $this->application_id],
                    'action_url' => '/dashboard/student/cv',
                ]);
            }
        });
    }

    // Staff found something to correct after approving: the CV goes back to
    // "ready for review" (the person's own submission is kept) and leaves the
    // Approved CVs list. The shareable link is switched off at the same time,
    // so an unchecked CV is never reachable from outside.
    public function unapprove(): void
    {
        DB::transaction(function () {
            $this->forceFill(['sent_at' => null, 'public_enabled' => false])->save();

            $application = $this->application;
            if ($application && $application->status === 'submitted') {
                $application->forceFill(['status' => 'draft', 'submitted_at' => null])->save();
            }
        });
    }

    // Older name, kept so existing callers keep working.
    public function sendToApplications(): void
    {
        $this->approve();
    }

    // Digits only, last 10 — enough to tell BD mobile numbers apart whether
    // they were typed 017…, +88017… or 88017….
    public static function phoneTail(?string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);

        return strlen($digits) >= 8 ? substr($digits, -10) : null;
    }

    public static function normaliseEmail(?string $email): ?string
    {
        $email = mb_strtolower(trim((string) $email));

        return $email !== '' ? $email : null;
    }

    // The Talent Passport of the same person. Only identifiers that belong to
    // one person count: the phone number or the e-mail address. A name never
    // does — two different people can share one. A lead that already belongs
    // to another account is never returned.
    public static function findCandidateFor(User $user): ?MobilityCandidate
    {
        $tail  = static::phoneTail($user->phone);
        $email = static::normaliseEmail($user->email);
        if (! $tail && ! $email) {
            return null;
        }

        return MobilityCandidate::where(function ($q) use ($tail, $email) {
                if ($tail) {
                    $q->orWhere('phone', 'like', '%' . $tail);
                }
                if ($email) {
                    $q->orWhereRaw('LOWER(TRIM(email)) = ?', [$email]);
                }
            })
            ->whereDoesntHave('cvAccess', fn ($q) => $q->where('user_id', '!=', $user->id))
            ->orderByDesc('id')
            ->first();
    }

    // What the screens show before staff confirm. Same rule as the real link:
    // phone or e-mail, never the name.
    public static function suggestCandidateFor(User $user): ?MobilityCandidate
    {
        return static::findCandidateFor($user);
    }

    // The account of the same person as a Talent Passport: same phone or same e-mail.
    public static function findUserFor(MobilityCandidate $candidate): ?User
    {
        $tail  = static::phoneTail($candidate->phone);
        $email = static::normaliseEmail($candidate->email);
        if (! $tail && ! $email) {
            return null;
        }

        return User::where('gateway_type', 'student')
            ->where(function ($q) use ($tail, $email) {
                if ($tail) {
                    $q->orWhere('phone', 'like', '%' . $tail);
                }
                if ($email) {
                    $q->orWhereRaw('LOWER(TRIM(email)) = ?', [$email]);
                }
            })
            ->orderBy('id')
            ->first();
    }

    // Opens My CV for an account and makes sure its draft "Job CV" application
    // exists (the CV record staff edit and approve). Safe to call repeatedly: it
    // reactivates a paused row and never creates a second application.
    //
    // $attach: staff said "this lead is the same person". The account is then
    // joined to THAT row instead of creating another one, so one person stays one
    // record. A row that an earlier activation created on its own is retired.
    public static function activateFor(User $user, ?User $by = null, ?MobilityCandidate $attach = null): self
    {
        return DB::transaction(function () use ($user, $by, $attach) {
            $access = static::where('user_id', $user->id)->lockForUpdate()->first()
                ?? new static(['user_id' => $user->id]);

            $access->status       = 'active';
            $access->activated_by = $access->activated_by ?: $by?->id;
            $access->activated_at = $access->activated_at ?: now();

            // Everyone whose CV staff open appears in Skilled Professionals. A
            // person who never used the chat gets a row of their own (source
            // "account"), so staff have one list to work from.
            $previous = $access->mobility_candidate_id
                ? MobilityCandidate::find($access->mobility_candidate_id)
                : null;

            if ($attach) {
                $takenBy = static::where('mobility_candidate_id', $attach->id)->where('user_id', '!=', $user->id)->exists();
                if ($takenBy) {
                    throw new \InvalidArgumentException('That lead already belongs to another account.');
                }

                // Fill gaps only; what the person told the chat is never overwritten.
                $attach->fill(array_filter([
                    'full_name' => blank($attach->full_name) ? $user->name : null,
                    'phone'     => blank($attach->phone) && $user->phone ? preg_replace('/[\s\-().]+/', '', $user->phone) : null,
                    'email'     => blank($attach->email) ? static::normaliseEmail($user->email) : null,
                ]))->save();

                $candidate = $attach;
            } else {
                $candidate = $previous ?: static::findCandidateFor($user);

                // Recognised by phone: remember the e-mail too (gap only).
                if ($candidate && blank($candidate->email) && ($email = static::normaliseEmail($user->email))) {
                    $candidate->forceFill(['email' => $email])->save();
                }
            }

            if (! $candidate) {
                $candidate = MobilityCandidate::create([
                    'source'    => 'account',
                    'status'    => 'new',
                    'full_name' => $user->name,
                    'phone'     => $user->phone ? preg_replace('/[\s\-().]+/', '', $user->phone) : null,
                    'email'     => static::normaliseEmail($user->email),
                    'lang'      => null,
                ]);
            }
            $access->mobility_candidate_id = $candidate->id;

            // The row an earlier activation made on its own is now a duplicate.
            if ($previous && $previous->id !== $candidate->id && $previous->source === 'account') {
                $previous->delete();
            }

            $access->save();

            if (! $access->application_id || ! Application::whereKey($access->application_id)->exists()) {
                $access->application_id = static::makeApplication($user, $candidate)->id;
                $access->save();
            }

            return $access;
        });
    }

    private static function makeApplication(User $user, ?MobilityCandidate $candidate): Application
    {
        $template = JobCvTemplate::ensure();

        $yesNo = fn (?bool $v) => $v === null ? null : ($v ? 'Yes / হ্যাঁ' : 'No / না');

        // Chat answers are copied in as a starting point, so the person is not
        // asked the same things twice. Only non-empty values are kept.
        $prefill = array_filter([
            'desired_job'      => $candidate?->role,
            'experience'       => $candidate?->experience,
            'licence_type'     => $candidate?->licence,
            'languages'        => $candidate?->languages,
            'target_country'   => $candidate?->target_country,
            'district'         => $candidate?->district,
            'has_passport'     => $yesNo($candidate?->has_passport),
            'can_visit_office' => $yesNo($candidate?->can_visit_office),
        ], fn ($v) => $v !== null && $v !== '');

        $application = Application::create([
            'form_template_id'  => $template->id,
            'user_id'           => $user->id,
            'submitted_by_role' => 'student',
            'student_name'      => $user->name,
            'student_email'     => $user->email,
            'student_phone'     => $user->phone ?: $candidate?->phone,
            'whatsapp_no'       => $user->phone ?: $candidate?->phone,
            'form_data'         => $prefill,
            'progress'          => 0,
            'status'            => 'draft',
        ]);

        $application->progress = $application->recalculateProgress();
        $application->save();

        return $application;
    }

    // Lazily creates the unguessable token used by the public CV link.
    public function ensureToken(): string
    {
        if (! $this->public_token) {
            do {
                $token = Str::random(32);
            } while (static::where('public_token', $token)->exists());

            $this->public_token = $token;
            $this->save();
        }

        return $this->public_token;
    }
}
