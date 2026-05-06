<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TensaiNotification extends Model
{
    use HasFactory;

    protected $table = 'tensai_notifications';

    protected $fillable = [
        'user_id', 'type', 'title', 'body',
        'data', 'action_url', 'is_read', 'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }

    public function markRead(): void
    {
        $this->update(['is_read' => true, 'read_at' => now()]);
    }
}
