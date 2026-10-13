<?php

// Prices used to ESTIMATE what an AI call cost, in US dollars per million tokens.
// They only feed the "AI Usage" report in the admin panel; they never bill
// anyone. A model that is not listed is logged with its tokens and no cost.
//
// Claude prices are Anthropic's published first-party rates as last checked on
// 2026-10-06. Check the provider's pricing page before relying on the totals,
// and add the model you use to this list (Gemini prices are not listed here).
return [
    'prices' => [
        'claude-haiku-5-5'  => ['input' => 0.10, 'output' => 0.50],
        'claude-sonnet-5-5' => ['input' => 2.00, 'output' => 10.00],
        'claude-opus-5-5'   => ['input' => 4.00, 'output' => 20.00],
    ],

    // Shown next to the USD figures in the admin report (approximate).
    'bdt_per_usd' => (float) env('AI_BDT_PER_USD', 120),
];
