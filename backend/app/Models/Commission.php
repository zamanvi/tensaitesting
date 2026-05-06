<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Commission extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 'type', 'payer_id', 'payee_id',
        'amount', 'currency', 'percent', 'status',
        'due_at', 'paid_at', 'payment_reference', 'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percent' => 'decimal:2',
        'due_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function lead() { return $this->belongsTo(Lead::class); }
    public function payer() { return $this->belongsTo(User::class, 'payer_id'); }
    public function payee() { return $this->belongsTo(User::class, 'payee_id'); }

    public function isPaid(): bool { return $this->status === 'paid'; }
    public function isDue(): bool { return $this->status === 'due'; }
}
