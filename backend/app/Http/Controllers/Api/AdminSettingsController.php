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
        $countries = Setting::where('key', 'target_countries')->value('value');
        $fees      = Setting::where('key', 'referral_fees')->value('value');
        return response()->json([
            'target_countries' => $countries ? json_decode($countries, true) : [],
            'referral_fees'    => $fees ? json_decode($fees, true) : (object)[],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'target_countries'   => 'sometimes|array',
            'target_countries.*' => 'array',
            'referral_fees'      => 'sometimes|array',
            'referral_fees.*'    => 'numeric|min:0',
        ]);

        if ($request->has('target_countries')) {
            Setting::set('target_countries', json_encode($request->target_countries));
        }
        if ($request->has('referral_fees')) {
            Setting::set('referral_fees', json_encode($request->referral_fees));
        }

        return response()->json(['message' => 'Settings saved.']);
    }
}
