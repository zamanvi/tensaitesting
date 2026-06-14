<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $raw = Setting::where('key', 'target_countries')->value('value');
        return response()->json([
            'target_countries' => $raw ? json_decode($raw, true) : [],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'target_countries'   => 'required|array',
            'target_countries.*' => 'array',
        ]);

        Setting::set('target_countries', json_encode($request->target_countries));

        return response()->json(['message' => 'Settings saved.']);
    }
}
