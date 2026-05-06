<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OcrJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'student_profile_id', 'document_type', 'original_file',
        'extracted_data', 'confidence_score', 'status', 'failure_reason',
        'data_applied', 'reviewed_by', 'reviewed_at', 'reviewer_notes',
    ];

    protected $casts = [
        'extracted_data' => 'array',
        'confidence_score' => 'decimal:2',
        'data_applied' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function studentProfile() { return $this->belongsTo(StudentProfile::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }

    public function needsReview(): bool { return $this->status === 'review_requested'; }
}
