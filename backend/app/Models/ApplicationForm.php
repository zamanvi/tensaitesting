<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApplicationForm extends Model
{
    protected $fillable = [
        'lead_id', 'branch_id',
        'date_of_birth', 'gender', 'nationality', 'address',
        'passport_number', 'passport_expiry',
        'last_qualification', 'institution_name', 'board_university', 'gpa_grade', 'passing_year',
        'jlpt_level', 'jlpt_score', 'jlpt_exam_date',
        'english_proficiency', 'english_score',
        'preferred_institution', 'preferred_cities',
        'sponsor_name', 'sponsor_relationship', 'sponsor_occupation', 'sponsor_monthly_income',
        'progress', 'status', 'submitted_at', 'custom_data',
    ];

    protected $casts = [
        'preferred_cities' => 'array',
        'date_of_birth'    => 'date',
        'passport_expiry'  => 'date',
        'jlpt_exam_date'   => 'date',
        'submitted_at'     => 'datetime',
        'custom_data'      => 'array',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function recalculateProgress(): int
    {
        $lead    = $this->lead;
        $student = $lead?->student;
        $docs    = $this->documents()->pluck('doc_type')->toArray();

        $checks = [
            // Personal (9)
            !empty($student?->name),
            !empty($student?->email),
            !empty($student?->phone),
            !empty($this->date_of_birth),
            !empty($this->gender),
            !empty($this->nationality),
            !empty($this->address),
            !empty($this->passport_number),
            !empty($this->passport_expiry),
            // Academic (5)
            !empty($this->last_qualification),
            !empty($this->institution_name),
            !empty($this->board_university),
            !empty($this->gpa_grade),
            !empty($this->passing_year),
            // Language (3)
            !empty($this->jlpt_level),
            !empty($this->english_proficiency),
            !empty($this->english_score),
            // Study Goals (4)
            !empty($lead?->target_country),
            !empty($lead?->target_course),
            !empty($lead?->target_intake),
            !empty($this->sponsor_name),
            !empty($this->sponsor_relationship),
            // Documents (5)
            in_array('photo',        $docs),
            in_array('passport',     $docs),
            in_array('certificate',  $docs),
            in_array('transcript',   $docs),
            in_array('nid',          $docs),
        ];

        $filled = count(array_filter($checks));
        $total  = count($checks);
        $score  = (int) round($filled / $total * 100);

        $this->update(['progress' => $score]);
        return $score;
    }
}
