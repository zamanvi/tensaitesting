<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Application;

class InstitutionSelection extends Model
{
    protected $fillable = [
        'lead_id',
        'institution_id',
        'connect_name',
        'connect_email',
        'connect_whatsapp',
        'connect_phone',
        'status',
        'selected_at',
        'accepted_at',
        'rejected_at',
        'processing_at',
        'completed_at',
        'admin_note',
        'admin_note_at',
    ];

    protected $casts = [
        'selected_at'   => 'datetime',
        'accepted_at'   => 'datetime',
        'rejected_at'   => 'datetime',
        'processing_at' => 'datetime',
        'completed_at'  => 'datetime',
        'admin_note_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Application::class, 'lead_id');
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(User::class, 'institution_id');
    }
}
