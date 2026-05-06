<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContactPaper extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_number', 'lead_id', 'interview_id', 'type',
        'from_user_id', 'to_user_id', 'cc_admin_id',
        'subject', 'body', 'attachments',
        'is_read', 'read_at', 'acknowledged_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'acknowledged_at' => 'datetime',
    ];

    public function lead() { return $this->belongsTo(Lead::class); }
    public function interview() { return $this->belongsTo(Interview::class); }
    public function sender() { return $this->belongsTo(User::class, 'from_user_id'); }
    public function recipient() { return $this->belongsTo(User::class, 'to_user_id'); }
    public function ccAdmin() { return $this->belongsTo(User::class, 'cc_admin_id'); }

    public function markRead(): void
    {
        $this->update(['is_read' => true, 'read_at' => now()]);
    }
}
