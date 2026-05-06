<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AgencyProfile;
use App\Models\TensaiNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgencyController extends Controller
{
    // Admin: approve agency vetting
    public function approve(Request $request, User $agency): JsonResponse
    {
        if (!$agency->isAgency()) {
            return response()->json(['message' => 'User is not an agency.'], 422);
        }

        $profile = $agency->agencyProfile;
        if (!$profile) {
            return response()->json(['message' => 'Agency profile not found.'], 404);
        }

        if ($profile->vetting_status === 'approved') {
            return response()->json(['message' => 'Agency already approved.'], 409);
        }

        // Auto-assign slot number
        $nextSlot = AgencyProfile::where('vetting_status', 'approved')->max('slot_number') + 1;

        $profile->update([
            'vetting_status' => 'approved',
            'slot_number' => $nextSlot,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        $agency->update(['status' => 'active']);

        TensaiNotification::create([
            'user_id' => $agency->id,
            'type' => 'agency_approved',
            'title' => 'Agency Approved',
            'body' => 'Your agency has been verified and approved. You now have full access to the Tensai platform.',
            'data' => ['slot_number' => $nextSlot],
            'action_url' => '/dashboard/agency',
        ]);

        return response()->json([
            'message' => 'Agency approved successfully.',
            'profile' => $profile->fresh(),
        ]);
    }

    // Admin: reject agency vetting
    public function reject(Request $request, User $agency): JsonResponse
    {
        if (!$agency->isAgency()) {
            return response()->json(['message' => 'User is not an agency.'], 422);
        }

        $profile = $agency->agencyProfile;
        if (!$profile) {
            return response()->json(['message' => 'Agency profile not found.'], 404);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $profile->update([
            'vetting_status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'approved_at' => null,
            'approved_by' => null,
        ]);

        $agency->update(['status' => 'suspended']);

        TensaiNotification::create([
            'user_id' => $agency->id,
            'type' => 'agency_rejected',
            'title' => 'Agency Application Rejected',
            'body' => 'Your agency application was not approved. Reason: ' . $validated['rejection_reason'],
            'data' => ['reason' => $validated['rejection_reason']],
            'action_url' => '/dashboard/agency',
        ]);

        return response()->json([
            'message' => 'Agency rejected.',
            'profile' => $profile->fresh(),
        ]);
    }
}
