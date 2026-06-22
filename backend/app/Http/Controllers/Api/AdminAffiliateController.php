<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAffiliateController extends Controller
{
    public function index(): JsonResponse
    {
        $affiliates = User::role('affiliate')
            ->with('affiliateProfile')
            ->latest()
            ->get()
            ->map(function ($u) {
                $u->setRelation('commissions', Commission::where('payee_id', $u->id)->get());
                return $this->format($u);
            });

        return response()->json($affiliates);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $request->validate(['status' => 'required|in:active,suspended,pending']);
        $user->update(['status' => $request->status]);
        $u = $user->fresh('affiliateProfile');
        $u->setRelation('commissions', Commission::where('payee_id', $u->id)->get());
        return response()->json($this->format($u));
    }

    public function markCommissionPaid(int $affiliateId, int $commissionId): JsonResponse
    {
        $commission = Commission::where('payee_id', $affiliateId)->findOrFail($commissionId);
        $commission->update(['status' => 'paid', 'paid_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function markAllPaid(int $affiliateId): JsonResponse
    {
        Commission::where('payee_id', $affiliateId)
            ->whereIn('status', ['pending', 'due'])
            ->update(['status' => 'paid', 'paid_at' => now()]);
        return response()->json(['success' => true]);
    }

    private function format(User $u): array
    {
        return [
            'id'          => $u->id,
            'name'        => $u->name,
            'email'       => $u->email,
            'status'      => $u->status,
            'profile'     => $u->affiliateProfile,
            'commissions' => $u->commissions ?? [],
            'created_at'  => $u->created_at->toISOString(),
        ];
    }
}
