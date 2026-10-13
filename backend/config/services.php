<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    // The AI behind the My CV English summary (it only ever receives a person's
    // job facts, never their name, phone or address). Without a key the feature
    // is simply off; the interview and the CV preview work without it.
    //
    // ONE slot is enough: put the key in AI_API_KEY. The provider is recognised
    // from the key itself (see App\Support\AiProvider): "sk-ant-..." is Claude,
    // "AIza..." is Gemini. To change provider, replace the key. AI_PROVIDER
    // (gemini | claude) overrides the detection, AI_MODEL overrides the model.
    'ai' => [
        'key'      => env('AI_API_KEY'),
        'provider' => env('AI_PROVIDER'),
        'model'    => env('AI_MODEL'),
    ],

    // Provider-specific names still work when AI_API_KEY is not set.
    'gemini' => [
        'key'   => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.5-flash-lite'),
    ],

    'anthropic' => [
        'key'   => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-sonnet-5-5'),
    ],

];
