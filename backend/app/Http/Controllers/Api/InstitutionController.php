<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InstitutionProfile;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InstitutionController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $profile = $request->user()->institutionProfile;
        return response()->json(['profile' => $profile]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'institution_name'          => 'required|string|max:255',
            'institution_name_local'    => 'nullable|string|max:255',
            'institution_type'          => 'nullable|in:university,college,language_school,vocational,employer',
            'country'                   => 'required|string|max:100',
            'city'                      => 'required|string|max:100',
            'address'                   => 'required|string',
            'website'                   => 'nullable|url',
            'description'               => 'nullable|string|max:1000',
            'intake_months'             => 'nullable|array',
            'accepted_qualifications'   => 'nullable|array',
            'required_language_scores'  => 'nullable|array',
            'tuition_fee_min'           => 'nullable|numeric|min:0',
            'tuition_fee_max'           => 'nullable|numeric|min:0',
            'currency'                  => 'nullable|string|max:10',
            'logo'                      => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user    = $request->user();
        $profile = $user->institutionProfile;
        $disk    = config('filesystems.disks.r2.key') ? 'r2' : 'public';

        if ($request->hasFile('logo')) {
            if ($profile?->logo) Storage::disk($disk)->delete($profile->logo);
            $file = $request->file('logo');
            $path = 'institution/logos/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));
            $validated['logo'] = $path;
        }

        if ($profile) {
            // Only allow editing if not yet active (approved)
            if ($profile->status === 'active') {
                return response()->json(['message' => 'Profile is locked after approval. Contact support to update.'], 403);
            }
            $validated['status'] = 'pending';
            $profile->update($validated);
        } else {
            $validated['user_id'] = $user->id;
            $validated['status']  = 'pending';
            $profile = InstitutionProfile::create($validated);
        }

        return response()->json([
            'message' => 'Institution profile saved. Awaiting admin review.',
            'profile' => $profile->fresh(),
        ]);
    }

    public function myLeads(Request $request): JsonResponse
    {
        $leads = Lead::where('assigned_institution_id', $request->user()->id)
            ->with('student:id,name,email')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($leads);
    }
}
