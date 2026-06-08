<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgencyProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AgencyProfileController extends Controller
{
    /** Get current agency's own profile */
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->agencyProfile;
        return response()->json(['profile' => $profile]);
    }

    /** Create or update agency profile */
    public function upsert(Request $request): JsonResponse
    {
        $request->validate([
            'agency_name'          => 'required|string|max:255',
            'agency_name_bn'       => 'nullable|string|max:255',
            'contact_person_name'  => 'required|string|max:255',
            'contact_person_phone' => 'required|string|max:30',
            'address'              => 'required|string|max:500',
            'city'                 => 'required|string|max:100',
            'registration_number'  => 'nullable|string|max:100',
            'trade_license'        => 'nullable|string|max:100',
            'website'              => 'nullable|url|max:255',
            'description'          => 'nullable|string|max:1000',
            'target_countries'     => 'nullable|array',
            'service_types'        => 'nullable|array',
            'logo'                 => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
            'trade_license_document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $user    = $request->user();
        $profile = $user->agencyProfile;
        $disk    = config('filesystems.disks.r2.key') ? 'r2' : 'public';

        $data = $request->only([
            'agency_name', 'agency_name_bn', 'contact_person_name',
            'contact_person_phone', 'address', 'city',
            'registration_number', 'trade_license', 'website',
            'description', 'target_countries', 'service_types',
        ]);

        // Upload logo
        if ($request->hasFile('logo')) {
            if ($profile?->logo) Storage::disk($disk)->delete($profile->logo);
            $file = $request->file('logo');
            $path = 'agency/logos/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));
            $data['logo'] = $path;
        }

        // Upload trade license document
        if ($request->hasFile('trade_license_document')) {
            if ($profile?->trade_license_document) Storage::disk($disk)->delete($profile->trade_license_document);
            $file = $request->file('trade_license_document');
            $path = 'agency/docs/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));
            $data['trade_license_document'] = $path;
        }

        if ($profile) {
            // Only allow editing if not yet approved
            if ($profile->vetting_status === 'approved') {
                return response()->json(['message' => 'Profile is locked after approval. Contact support to update.'], 403);
            }
            // Reset to pending on re-submission
            $data['vetting_status'] = 'pending';
            $profile->update($data);
        } else {
            $data['user_id']        = $user->id;
            $data['vetting_status'] = 'pending';
            $profile = AgencyProfile::create($data);
        }

        return response()->json([
            'message' => 'Agency profile saved. Awaiting admin review.',
            'profile' => $profile->fresh(),
        ], 201);
    }
}
