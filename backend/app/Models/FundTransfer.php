<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FundTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id', 'amount', 'currency', 'period_from', 'period_to',
        'status', 'bank_reference', 'receiver_id', 'received_at', 'notes',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'period_from'  => 'date',
        'period_to'    => 'date',
        'received_at'  => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function isPending(): bool { return $this->status === 'pending'; }
    public function isReceived(): bool { return $this->status === 'received'; }
}
