<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Commission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function affiliateDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        // Auto-create profile on first dashboard visit so the page never 404s
        $profile = $user->affiliateProfile
            ?? AffiliateProfile::create(['user_id' => $user->id]);

        $earningsByStatus = Commission::where('payee_id', $user->id)
            ->selectRaw('status, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return response()->json([
            'profile' => $profile,
            'affiliate_code' => $user->affiliate_code,
            'total_referrals' => $profile->total_referrals,
            'converted_referrals' => $profile->converted_referrals,
            'conversion_rate' => $profile->conversionRate(),
            'total_earned' => $profile->total_earned,
            'pending_payout' => $profile->pending_payout,
            'earnings_by_status' => $earningsByStatus,
        ]);
    }

    public function referrals(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $convertedStudentIds = Commission::where('payee_id', $userId)
            ->where('status', 'paid')
            ->with('lead:id,student_id')
            ->get()
            ->pluck('lead.student_id')
            ->filter()
            ->unique()
            ->values();

        $referrals = User::where('referred_by', $userId)
            ->select('id', 'name', 'gateway_type', 'status', 'created_at')
            ->orderByDesc('created_at')
            ->paginate(20);

        $referrals->getCollection()->transform(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'gateway_type' => $u->gateway_type,
            'status' => $u->status,
            'joined_at' => $u->created_at,
            'converted' => $convertedStudentIds->contains($u->id),
        ]);

        return response()->json($referrals);
    }

    public function earnings(Request $request): JsonResponse
    {
        $commissions = Commission::where('payee_id', $request->user()->id)
            ->with(['lead:id,lead_code,student_id', 'lead.student:id,name'])
            ->latest()
            ->paginate(20);

        return response()->json($commissions);
    }

    public function index(Request $request): JsonResponse
    {
        $commissions = Commission::with([
            'lead:id,lead_code',
            'payer:id,name,gateway_type',
            'payee:id,name,gateway_type',
        ])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->when($request->payee_id, fn ($q) => $q->where('payee_id', $request->payee_id))
            ->latest()
            ->paginate(25);

        $summary = Commission::selectRaw('status, SUM(amount) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json(['commissions' => $commissions, 'summary' => $summary]);
    }

    public function upgradeRequest(Request $request): JsonResponse
    {
        $user = $request->user();

        \Illuminate\Support\Facades\Log::info('Affiliate upgrade request', [
            'user_id'        => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'affiliate_code' => $user->affiliate_code,
            'requested_at'   => now()->toIso8601String(),
        ]);

        return response()->json([
            'message' => 'Upgrade request received. Our team will review and contact you within 2–3 business days.',
        ]);
    }
}
