<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 'student_id', 'institution_id', 'arranged_by',
        'medium', 'meeting_link', 'scheduled_at', 'duration_minutes',
        'status', 'result', 'institution_notes', 'admin_notes',
        'contact_paper', 'confirmed_at', 'completed_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'completed_at' => 'datetime',
        'duration_minutes' => 'integer',
    ];

    public function lead() { return $this->belongsTo(Lead::class); }
    public function student() { return $this->belongsTo(User::class, 'student_id'); }
    public function institution() { return $this->belongsTo(User::class, 'institution_id'); }
    public function arranger() { return $this->belongsTo(User::class, 'arranged_by'); }
    public function contactPapers() { return $this->hasMany(ContactPaper::class); }

    public function isUpcoming(): bool
    {
        return $this->status === 'confirmed' && $this->scheduled_at->isFuture();
    }
}
