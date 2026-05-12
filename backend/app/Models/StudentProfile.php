<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'full_name', 'full_name_japanese', 'date_of_birth',
        'gender', 'nationality', 'religion', 'address_bangladesh',
        'passport_number', 'passport_expiry', 'passport_document',
        'nid_number', 'nid_document', 'highest_qualification', 'gpa',
        'institution_name', 'passing_year', 'jlpt_level', 'nat_level',
        'ielts_score', 'language_documents', 'is_ocr_verified', 'ocr_status',
        'admin_notes', 'locked_at', 'locked_by',
        'phone_visible_to_institution', 'email_visible_to_institution',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'passport_expiry' => 'date',
        'language_documents' => 'array',
        'is_ocr_verified' => 'boolean',
        'is_admin_verified' => 'boolean',
        'is_data_locked' => 'boolean',
        'phone_visible_to_institution' => 'boolean',
        'email_visible_to_institution' => 'boolean',
        'locked_at' => 'datetime',
        'gpa' => 'decimal:2',
        'ielts_score' => 'decimal:1',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function locker() { return $this->belongsTo(User::class, 'locked_by'); }
    public function ocrJobs() { return $this->hasMany(OcrJob::class); }

    public function lock(int $adminId): void
    {
        $this->update([
            'is_data_locked' => true,
            'locked_at' => now(),
            'locked_by' => $adminId,
        ]);
    }

    public function eligibilityScore(): int
    {
        $score = 0;
        if ($this->jlpt_level) $score += 30;
        if ($this->nat_level) $score += 20;
        if ($this->highest_qualification) $score += 20;
        if ($this->gpa && $this->gpa >= 3.0) $score += 15;
        if ($this->passport_number) $score += 10;
        if ($this->is_admin_verified) $score += 5;
        return min($score, 100);
    }
}
