<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HelpRequest extends Model
{
    protected $fillable = [
        'user_id', 'document_type', 'contact_via', 'status', 'note', 'contacted_at',
    ];

    protected $casts = [
        'contacted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
