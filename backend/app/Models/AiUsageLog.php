<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// One call to an AI service: counts only (see the create_ai_usage_logs migration).
class AiUsageLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'feature', 'provider', 'model', 'user_id',
        'input_tokens', 'output_tokens', 'cached_input_tokens',
        'cost_usd', 'ok', 'error', 'latency_ms',
    ];

    protected $casts = [
        'ok'       => 'boolean',
        'cost_usd' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
