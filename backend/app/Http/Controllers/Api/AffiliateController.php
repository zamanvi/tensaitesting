<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateManagedEntity;
use App\Models\AffiliateProfile;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateController extends Controller
{
    // ── Onboarding: choose type ────────────────────────────────────────────────

    /**
     * Set affiliate type (local or global) on first login.
     * Idempotent — calling again with the same type is harmless.
     */
    public function setType(Request $request): JsonResponse
    {
        $request->validate([
            'affiliate_type' => 'required|in:local,global',
        ]);

        $user    = $request->user();
        $profile = $this->ensureProfile($user);

        $profile->update([
            'affiliate_type'  => $request->affiliate_type,
            'type_confirmed'  => true,
        ]);

        return response()->json([
            'message'        => 'Affiliate type set.',
            'affiliate_type' => $profile->affiliate_type,
        ]);
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public function showProfile(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = $this->ensureProfile($user);

        return response()->json([
            'profile'        => $profile,
            'affiliate_code' => $user->affiliate_code,
            'affiliate_link' => url('/auth/register?ref=' . $user->affiliate_code),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'country'              => 'nullable|string|max:100',
            'bio'                  => 'nullable|string|max:500',
            'organization_name'    => 'nullable|string|max:200',
            'designation'          => 'nullable|string|max:100',
            'website'              => 'nullable|url|max:255',
            'target_regions'       => 'nullable|array',
            'target_regions.*'     => 'string|max:100',
            'bank_name'            => 'nullable|string|max:100',
            'bank_account_number'  => 'nullable|string|max:50',
            'bank_account_name'    => 'nullable|string|max:150',
            'bkash_number'         => 'nullable|string|max:20',
            'nagad_number'         => 'nullable|string|max:20',
        ]);

        $user    = $request->user();
        $profile = $this->ensureProfile($user);

        $profile->update($request->only([
            'country', 'bio',
            'organization_name', 'designation', 'website', 'target_regions',
            'bank_name', 'bank_account_number', 'bank_account_name',
            'bkash_number', 'nagad_number',
        ]));

        return response()->json([
            'message' => 'Profile updated.',
            'profile' => $profile->fresh(),
        ]);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = $this->ensureProfile($user);

        // Earnings breakdown from commissions table
        $earningsByStatus = Commission::where('payee_id', $user->id)
            ->selectRaw('status, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $base = [
            'affiliate_type'     => $profile->affiliate_type,
            'type_confirmed'     => $profile->type_confirmed,
            'affiliate_code'     => $user->affiliate_code,
            'affiliate_link'     => url('/auth/register?ref=' . $user->affiliate_code),
            'performance_level'  => $profile->performance_level,
            'total_earned'       => (float) $profile->total_earned,
            'pending_payout'     => (float) $profile->pending_payout,
            'earnings_by_status' => $earningsByStatus,
        ];

        if ($profile->isLocal()) {
            return response()->json(array_merge($base, [
                'total_referrals'      => $profile->total_referrals,
                'converted_referrals'  => $profile->converted_referrals,
                'conversion_rate'      => $profile->conversionRate(),
                'commission_per_student' => (float) $profile->local_commission_fixed,
                // recent referrals preview
                'recent_referrals'     => $this->recentReferrals($user->id, 5),
            ]));
        }

        // Global affiliate dashboard
        return response()->json(array_merge($base, [
            'managed_institutions_count' => $profile->managed_institutions_count,
            'managed_employees_count'    => $profile->managed_employees_count,
            'total_enrollments'          => AffiliateManagedEntity::where('affiliate_user_id', $user->id)
                                               ->sum('total_enrollments'),
            'commission_percent'         => (float) $profile->global_commission_percent,
            // preview lists
            'recent_institutions'        => $profile->managedInstitutions()
                                               ->select('id','name','country','status','total_enrollments','total_earned')
                                               ->latest()->limit(3)->get(),
            'recent_employees'           => $profile->managedEmployees()
                                               ->select('id','name','country','designation','status')
                                               ->latest()->limit(3)->get(),
        ]));
    }

    // ── Local: referred students ───────────────────────────────────────────────

    public function referredStudents(Request $request): JsonResponse
    {
        $profile = $this->ensureProfile($request->user());
        if (!$profile->isLocal()) {
            return response()->json(['message' => 'This endpoint is for local affiliates only.'], 403);
        }
        $userId = $request->user()->id;

        // IDs of students whose leads have been paid commission to this affiliate
        $convertedStudentIds = Commission::where('payee_id', $userId)
            ->whereIn('type', ['affiliate_associate'])
            ->whereIn('status', ['paid', 'due'])
            ->with('lead:id,student_id')
            ->get()
            ->pluck('lead.student_id')
            ->filter()
            ->unique()
            ->values();

        $referrals = User::where('referred_by', $userId)
            ->select('id', 'name', 'gateway_type', 'status', 'created_at')
            ->latest()
            ->paginate(20);

        $referrals->getCollection()->transform(function (User $u) use ($convertedStudentIds) {
            // Check if this student has an active lead
            $lead = Lead::where('student_id', $u->id)
                ->select('id', 'status', 'lead_code')
                ->latest()
                ->first();

            return [
                'id'           => $u->id,
                'name'         => $u->name,
                'gateway_type' => $u->gateway_type,
                'status'       => $u->status,
                'joined_at'    => $u->created_at,
                'converted'    => $convertedStudentIds->contains($u->id),
                'lead_status'  => $lead?->status,
                'lead_code'    => $lead?->lead_code,
            ];
        });

        return response()->json($referrals);
    }

    // ── Global: managed entities ───────────────────────────────────────────────

    public function entities(Request $request): JsonResponse
    {
        $profile = $this->ensureProfile($request->user());
        if (!$profile->isGlobal()) {
            return response()->json(['message' => 'This endpoint is for global affiliates only.'], 403);
        }
        $userId = $request->user()->id;
        $type   = $request->query('type'); // 'institution' | 'employee' | null (both)

        $query = AffiliateManagedEntity::where('affiliate_user_id', $userId)
            ->when($type, fn ($q) => $q->where('entity_type', $type))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest();

        return response()->json($query->paginate(20));
    }

    public function storeEntity(Request $request): JsonResponse
    {
        if (!$this->ensureProfile($request->user())->isGlobal()) {
            return response()->json(['message' => 'This endpoint is for global affiliates only.'], 403);
        }
        $request->validate([
            'entity_type'       => 'required|in:institution,employee',
            'name'              => 'required|string|max:200',
            'contact_email'     => 'nullable|email|max:255',
            'contact_phone'     => 'nullable|string|max:30',
            'website'           => 'nullable|url|max:255',
            'country'           => 'nullable|string|max:100',
            'city'              => 'nullable|string|max:100',
            'specialty'         => 'nullable|string|max:100',
            'capacity'          => 'nullable|integer|min:1',
            'designation'       => 'nullable|string|max:100',
            'status'            => 'nullable|in:prospect,active,inactive',
            'commission_percent'=> 'nullable|numeric|min:0|max:100',
            'notes'             => 'nullable|string|max:1000',
        ]);

        $user   = $request->user();
        $entity = AffiliateManagedEntity::create(array_merge(
            $request->only([
                'entity_type', 'name', 'contact_email', 'contact_phone',
                'website', 'country', 'city', 'specialty', 'capacity',
                'designation', 'status', 'commission_percent', 'notes',
            ]),
            ['affiliate_user_id' => $user->id]
        ));

        // Update denormalized count on profile
        $this->syncEntityCounts($user->id);

        return response()->json([
            'message' => 'Entity added.',
            'entity'  => $entity,
        ], 201);
    }

    public function updateEntity(Request $request, int $id): JsonResponse
    {
        $entity = AffiliateManagedEntity::where('affiliate_user_id', $request->user()->id)
            ->findOrFail($id);

        $request->validate([
            'name'              => 'sometimes|string|max:200',
            'contact_email'     => 'nullable|email|max:255',
            'contact_phone'     => 'nullable|string|max:30',
            'website'           => 'nullable|url|max:255',
            'country'           => 'nullable|string|max:100',
            'city'              => 'nullable|string|max:100',
            'specialty'         => 'nullable|string|max:100',
            'capacity'          => 'nullable|integer|min:1',
            'designation'       => 'nullable|string|max:100',
            'status'            => 'sometimes|in:prospect,active,inactive',
            'commission_percent'=> 'nullable|numeric|min:0|max:100',
            'notes'             => 'nullable|string|max:1000',
        ]);

        $entity->update($request->only([
            'name', 'contact_email', 'contact_phone', 'website',
            'country', 'city', 'specialty', 'capacity', 'designation',
            'status', 'commission_percent', 'notes',
        ]));

        return response()->json(['message' => 'Entity updated.', 'entity' => $entity->fresh()]);
    }

    public function deleteEntity(Request $request, int $id): JsonResponse
    {
        $entity = AffiliateManagedEntity::where('affiliate_user_id', $request->user()->id)
            ->findOrFail($id);

        $entity->delete();

        $this->syncEntityCounts($request->user()->id);

        return response()->json(['message' => 'Entity removed.']);
    }

    // ── Commissions / Earnings ─────────────────────────────────────────────────

    public function commissions(Request $request): JsonResponse
    {
        $commissions = Commission::where('payee_id', $request->user()->id)
            ->with(['lead:id,lead_code,student_id', 'lead.student:id,name'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20);

        $summary = Commission::where('payee_id', $request->user()->id)
            ->selectRaw('status, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        return response()->json([
            'commissions' => $commissions,
            'summary'     => $summary,
        ]);
    }

    // ── Upgrade request (local → global) ──────────────────────────────────────

    public function upgradeRequest(Request $request): JsonResponse
    {
        $profile = $this->ensureProfile($request->user());
        if (!$profile->isLocal()) {
            return response()->json(['message' => 'Only local affiliates can request an upgrade.'], 403);
        }
        if ($profile->upgrade_status === 'pending') {
            return response()->json(['message' => 'You already have a pending upgrade request.'], 409);
        }
        if ($profile->upgrade_status === 'approved') {
            return response()->json(['message' => 'Your account has already been upgraded.'], 409);
        }

        $request->validate([
            'organization_name' => 'nullable|string|max:200',
            'reason'            => 'nullable|string|max:1000',
        ]);

        $profile->update([
            'upgrade_request_reason' => $request->reason,
            'upgrade_requested_at'   => now(),
            'upgrade_status'         => 'pending',
        ]);

        if ($request->organization_name) {
            $profile->update(['organization_name' => $request->organization_name]);
        }

        return response()->json([
            'message'        => 'Upgrade request received. Our team will review and contact you within 2–3 business days.',
            'upgrade_status' => 'pending',
        ]);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function ensureProfile(User $user): AffiliateProfile
    {
        return $user->affiliateProfile
            ?? AffiliateProfile::create(['user_id' => $user->id]);
    }

    private function recentReferrals(int $userId, int $limit): array
    {
        return User::where('referred_by', $userId)
            ->select('id', 'name', 'gateway_type', 'status', 'created_at')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (User $u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'gateway_type' => $u->gateway_type,
                'status'       => $u->status,
                'joined_at'    => $u->created_at,
            ])
            ->toArray();
    }

    private function syncEntityCounts(int $userId): void
    {
        $profile = AffiliateProfile::firstWhere('user_id', $userId);
        if (! $profile) return;

        $profile->update([
            'managed_institutions_count' => AffiliateManagedEntity::where('affiliate_user_id', $userId)
                ->where('entity_type', 'institution')->count(),
            'managed_employees_count' => AffiliateManagedEntity::where('affiliate_user_id', $userId)
                ->where('entity_type', 'employee')->count(),
        ]);
    }
}
