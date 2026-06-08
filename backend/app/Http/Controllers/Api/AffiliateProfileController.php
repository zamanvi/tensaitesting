<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateProfileController extends Controller
{
    /** Get current affiliate's own profile */
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->affiliateProfile;
        return response()->json(['profile' => $profile]);
    }

    /** Create or update affiliate profile (payout details + bio) */
    public function upsert(Request $request): JsonResponse
    {
        $request->validate([
            'country'             => 'nullable|string|max:100',
            'bio'                 => 'nullable|string|max:500',
            'bank_name'           => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name'   => 'nullable|string|max:150',
            'bkash_number'        => 'nullable|string|max:20',
            'nagad_number'        => 'nullable|string|max:20',
        ]);

        $user    = $request->user();
        $profile = $user->affiliateProfile;

        $data = $request->only([
            'country', 'bio',
            'bank_name', 'bank_account_number', 'bank_account_name',
            'bkash_number', 'nagad_number',
        ]);

        if ($profile) {
            $profile->update($data);
        } else {
            $data['user_id'] = $user->id;
            $profile = AffiliateProfile::create($data);
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'profile' => $profile->fresh(),
        ]);
    }
}
