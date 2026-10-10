<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'https://tensai.vercel.app',
        'https://tensai-kappa.vercel.app',
        'https://tensaiconsultancy.com',
        'https://www.tensaiconsultancy.com',
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [
        '#^https://tensai[a-z0-9\-]*\.vercel\.app$#',
        '#^https://[a-z0-9\-]*\.vercel\.app$#',
        '#^https://([a-z0-9\-]+\.)?tensaiconsultancy\.com$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    // Let browsers remember the preflight answer for 2h (Chrome's cap). With 0 every
    // authenticated API call was preceded by its own OPTIONS round trip.
    'max_age' => 7200,

    'supports_credentials' => false,

];
