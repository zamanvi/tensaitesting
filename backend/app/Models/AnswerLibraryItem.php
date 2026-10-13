<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

// One staff-verified question and answer. See the create_answer_library_tables
// migration for the rules: only verified, unexpired items are ever served.
class AnswerLibraryItem extends Model
{
    public const STATUSES = ['draft' => 'Draft', 'verified' => 'Verified', 'archived' => 'Archived'];

    public const CATEGORIES = [
        'ssw_basics'  => 'SSW basics',
        'language'    => 'Japanese language tests',
        'skills_test' => 'Skills tests',
        'caregiver'   => 'Caregiver (nursing care)',
        'driver'      => 'Driver (automobile transport)',
        'process'     => 'Process and paperwork',
        'safety'      => 'Fees and staying safe',
        'tensai'      => 'About our service and CV',
    ];

    // What a verified answer is made of: changing any of it needs a fresh check.
    private const CONTENT_FIELDS = [
        'question_en', 'question_bn', 'keywords',
        'answer_en', 'answer_bn', 'answer_ja', 'source_url', 'valid_until',
    ];

    protected $fillable = [
        'slug', 'category', 'question_en', 'question_bn', 'keywords',
        'answer_en', 'answer_bn', 'answer_ja', 'source_url', 'staff_note',
        'status', 'verified_by', 'verified_at', 'valid_until', 'sort_order',
        'times_shown', 'helpful_yes', 'helpful_no',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
        'valid_until' => 'date',
    ];

    protected static function booted(): void
    {
        // A verified answer that is edited is no longer verified: staff must
        // check the new wording and verify it again. Status changes made by the
        // Verify / Archive actions themselves are left alone.
        static::updating(function (AnswerLibraryItem $item) {
            if ($item->isDirty('status')) {
                return;
            }
            if ($item->getOriginal('status') === 'verified' && $item->isDirty(self::CONTENT_FIELDS)) {
                $item->status      = 'draft';
                $item->verified_by = null;
                $item->verified_at = null;
            }
        });
    }

    // Items a user may be shown.
    public function scopeServable(Builder $query): Builder
    {
        return $query->where('status', 'verified')
            ->where(fn ($q) => $q->whereNull('valid_until')->orWhereDate('valid_until', '>=', now()->toDateString()));
    }

    public function isServable(): bool
    {
        return $this->status === 'verified'
            && ($this->valid_until === null || $this->valid_until->endOfDay()->isFuture());
    }

    // Question and answer in the reader's language; Bangla and Japanese fall
    // back to English when no translation was written.
    public function questionFor(string $lang): string
    {
        return $lang === 'bn' && filled($this->question_bn) ? $this->question_bn : $this->question_en;
    }

    public function answerFor(string $lang): string
    {
        return match (true) {
            $lang === 'bn' && filled($this->answer_bn) => $this->answer_bn,
            $lang === 'ja' && filled($this->answer_ja) => $this->answer_ja,
            default                                    => $this->answer_en,
        };
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
