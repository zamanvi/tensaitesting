<?php

namespace App\Support;

// Works out WHICH AI service to call and with which key, from configuration.
//
// The person setting it up only has to fill ONE slot, AI_API_KEY. The provider
// is read from the key itself, so replacing the key switches the provider:
//
//   sk-ant-...   Anthropic (Claude)
//   AIza...      Google (Gemini)
//
// AI_PROVIDER ("gemini" or "claude") overrides the detection and AI_MODEL
// overrides the model. The older provider-specific variables (GEMINI_API_KEY,
// ANTHROPIC_API_KEY) are used only when AI_API_KEY is empty.
//
// The key is never returned to the browser or written anywhere; callers that
// show a status use label().
class AiProvider
{
    public const GEMINI    = 'gemini';
    public const ANTHROPIC = 'anthropic';

    /** @return array{provider:string, key:string, model:string}|null  null = no usable AI configured */
    public static function resolve(): ?array
    {
        $key = trim((string) config('services.ai.key'));

        if ($key !== '') {
            $provider = self::normalise((string) config('services.ai.provider')) ?? self::detect($key);

            return $provider === null ? null : self::build($provider, $key);
        }

        // Legacy, provider-specific variables.
        if (filled(config('services.gemini.key'))) {
            return self::build(self::GEMINI, trim((string) config('services.gemini.key')));
        }
        if (filled(config('services.anthropic.key'))) {
            return self::build(self::ANTHROPIC, trim((string) config('services.anthropic.key')));
        }

        return null;
    }

    public static function detect(string $key): ?string
    {
        return match (true) {
            str_starts_with($key, 'sk-ant-') => self::ANTHROPIC,
            str_starts_with($key, 'AIza')    => self::GEMINI,
            default                          => null,
        };
    }

    // Human-readable state for the admin Settings page. Never includes the key.
    public static function statusLabel(): string
    {
        $key = trim((string) config('services.ai.key'));
        $cfg = self::resolve();

        if ($cfg !== null) {
            $name = $cfg['provider'] === self::ANTHROPIC ? 'Claude (Anthropic)' : 'Gemini (Google)';

            return "{$name}, model {$cfg['model']}. The \"Write English summary\" button is available to users.";
        }

        return $key !== ''
            ? 'The key in AI_API_KEY is not recognised (Claude keys start with "sk-ant-", Gemini keys with "AIza"). The summary button is hidden.'
            : 'No AI key is set. The summary button is hidden; everything else works.';
    }

    private static function normalise(string $value): ?string
    {
        return match (strtolower(trim($value))) {
            'gemini', 'google'            => self::GEMINI,
            'claude', 'anthropic'         => self::ANTHROPIC,
            default                       => null,
        };
    }

    private static function build(string $provider, string $key): array
    {
        $model = trim((string) config('services.ai.model'))
            ?: trim((string) config($provider === self::ANTHROPIC ? 'services.anthropic.model' : 'services.gemini.model'));

        return ['provider' => $provider, 'key' => $key, 'model' => $model];
    }
}
