<?php

namespace App\Support;

use App\Models\AiUsageLog;
use Illuminate\Support\Facades\Log;

// Writes one AI usage row. This is bookkeeping: it must never break the feature
// that called it, so every failure here is swallowed (and logged).
class AiUsage
{
    public static function record(
        string $feature,
        string $provider,
        string $model,
        int $inputTokens = 0,
        int $outputTokens = 0,
        bool $ok = true,
        ?string $error = null,
        ?int $latencyMs = null,
        ?int $userId = null,
        int $cachedInputTokens = 0,
    ): void {
        try {
            AiUsageLog::create([
                'feature'             => $feature,
                'provider'            => $provider,
                'model'               => $model,
                'user_id'             => $userId,
                'input_tokens'        => max(0, $inputTokens),
                'output_tokens'       => max(0, $outputTokens),
                'cached_input_tokens' => max(0, $cachedInputTokens),
                'cost_usd'            => self::cost($model, $inputTokens, $outputTokens),
                'ok'                  => $ok,
                'error'               => $error !== null ? mb_substr($error, 0, 40) : null,
                'latency_ms'          => $latencyMs,
            ]);
        } catch (\Throwable $e) {
            Log::warning('AI usage log could not be written', ['error' => $e->getMessage()]);
        }
    }

    // Estimated dollars, or null when the model has no listed price.
    public static function cost(string $model, int $inputTokens, int $outputTokens): ?float
    {
        $price = config('ai.prices.' . $model);
        if (! is_array($price)) {
            return null;
        }

        return round(
            ($inputTokens * $price['input'] + $outputTokens * $price['output']) / 1_000_000,
            6
        );
    }
}
