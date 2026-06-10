<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\StudentProfile;
use App\Models\TensaiNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LeadController extends Controller
{
    public function myLeads(Request $request): JsonResponse
    {
        $leads = Lead::where('student_id', $request->user()->id)
            ->with(['assignedAgency:id,name', 'assignedInstitution:id,name'])
            ->latest()
            ->paginate(15);

        return response()->json($leads);
    }

    public function privateVault(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $leads = Lead::where(function ($q) use ($userId) {
                // Leads this agency sourced
                $q->where('source_agency_id', $userId)->where('pool_type', 'private');
            })->orWhere(function ($q) use ($userId) {
                // Leads forwarded TO this agency by another agency
                $q->where('assigned_agency_id', $userId)->whereNotNull('forwarded_from_agency_id');
            })
            ->with([
                'student:id,name',
                'student.studentProfile:id,user_id,jlpt_level,gpa,highest_qualification',
                'forwardedFromAgency:id,name',
            ])
            ->latest()
            ->paginate(20);

        return response()->json($leads);
    }

    private function requireApprovedAgency(Request $request): ?JsonResponse
    {
        $profile = $request->user()->agencyProfile;
        if (!$profile || $profile->vetting_status !== 'approved') {
            return response()->json([
                'message' => 'Your agency must be approved before performing this action.',
                'vetting_status' => $profile?->vetting_status ?? 'none',
            ], 403);
        }
        return null;
    }

    public function addLead(Request $request): JsonResponse
    {
        if ($gate = $this->requireApprovedAgency($request)) return $gate;

        $validated = $request->validate([
            'student_name'   => 'required|string|max:255',
            'student_email'  => 'required|email|max:255',
            'student_phone'  => 'nullable|string|max:20',
            'target_country' => 'required|string|max:100',
            'target_course'  => 'nullable|string|max:255',
            'target_intake'  => 'nullable|date',
        ]);

        $student = User::where('email', $validated['student_email'])->first();

        if ($student && $student->gateway_type !== 'student') {
            return response()->json(['message' => 'This email belongs to a non-student account.'], 422);
        }

        if (!$student) {
            $student = User::create([
                'name'           => $validated['student_name'],
                'email'          => $validated['student_email'],
                'phone'          => $validated['student_phone'] ?? null,
                'password'       => Hash::make(Str::random(16)),
                'gateway_type'   => 'student',
                'status'         => 'pending',
                'affiliate_code' => 'TEN-' . strtoupper(Str::random(8)),
            ]);
            $student->assignRole('student');
            StudentProfile::create(['user_id' => $student->id]);
        }

        $exists = Lead::where('student_id', $student->id)
            ->where('source_agency_id', $request->user()->id)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'You already have a lead for this student.'], 422);
        }

        $lead = Lead::create([
            'student_id'       => $student->id,
            'source_agency_id' => $request->user()->id,
            'pool_type'        => 'private',
            'status'           => 'new',
            'target_country'   => $validated['target_country'],
            'target_course'    => $validated['target_course'] ?? null,
            'target_intake'    => $validated['target_intake'] ?? null,
        ]);

        return response()->json([
            'message' => 'Lead created successfully.',
            'lead'    => $lead->load('student:id,name,email'),
        ], 201);
    }

    public function agencyPartners(Request $request): JsonResponse
    {
        $agencies = User::where('gateway_type', 'agency')
            ->where('id', '!=', $request->user()->id)
            ->where('status', 'active')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json($agencies);
    }

    public function openPool(Request $request): JsonResponse
    {
        $leads = Lead::where('pool_type', 'open')
            ->where('is_published', true)
            ->where('status', 'new')
            ->with(['student:id,name', 'student.studentProfile:id,user_id,jlpt_level,nat_level,gpa,highest_qualification'])
            ->latest()
            ->paginate(20);

        $leads->getCollection()->transform(function (Lead $lead) {
            $profile = $lead->student->studentProfile;
            return array_merge($lead->only([
                'id', 'lead_code', 'status', 'target_country', 'target_course', 'unlock_fee', 'is_locked',
            ]), [
                'student_summary' => $profile ? $profile->only(['jlpt_level', 'nat_level', 'gpa', 'highest_qualification']) : null,
            ]);
        });

        return response()->json($leads);
    }

    public function publishToOpenPool(Request $request, Lead $lead): JsonResponse
    {
        if ($gate = $this->requireApprovedAgency($request)) return $gate;

        if ($lead->source_agency_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $lead->publishToOpenPool();

        return response()->json(['message' => 'Lead published to open pool.', 'lead' => $lead]);
    }

    public function forwardLead(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'target_agency_id' => 'required|exists:users,id',
            'referral_fee' => 'nullable|numeric|min:0',
        ]);

        if ($lead->source_agency_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $targetAgency = User::findOrFail($validated['target_agency_id']);
        if (!$targetAgency->isAgency()) {
            return response()->json(['message' => 'Target must be an agency.'], 422);
        }

        // Prevent circular forwarding (forwarding back to the original source)
        if ($lead->forwarded_from_agency_id && $validated['target_agency_id'] == $lead->forwarded_from_agency_id) {
            return response()->json(['message' => 'Cannot forward lead back to the agency it was forwarded from.'], 422);
        }

        // Prevent forwarding to self
        if ($validated['target_agency_id'] == $request->user()->id) {
            return response()->json(['message' => 'Cannot forward a lead to yourself.'], 422);
        }

        $lead->update([
            'assigned_agency_id' => $validated['target_agency_id'],
            'forwarded_from_agency_id' => $request->user()->id,
            'referral_fee' => $validated['referral_fee'] ?? 0,
        ]);

        return response()->json(['message' => 'Lead forwarded successfully.', 'lead' => $lead]);
    }

    public function unlockLead(Request $request, Lead $lead): JsonResponse
    {
        if ($gate = $this->requireApprovedAgency($request)) return $gate;

        if ($lead->pool_type !== 'open') {
            return response()->json(['message' => 'Lead is not in open pool.'], 422);
        }

        $lead->update([
            'pool_type' => 'private',
            'assigned_agency_id' => $request->user()->id,
            'is_published' => false,
            'is_locked' => false,
        ]);

        // Platform admin receives the unlock fee.
        // Uses the configured platform_admin_id (defaults to 1 = first super_admin).
        $platformAdminId = (int) config('app.platform_admin_id', 1);

        Commission::create([
            'lead_id'  => $lead->id,
            'type'     => 'lead_unlock_fee',
            'payer_id' => $request->user()->id,
            'payee_id' => $platformAdminId,
            'amount'   => $lead->unlock_fee ?? 10000,
            'currency' => 'BDT',
            'status'   => 'due',
        ]);

        return response()->json(['message' => 'Lead unlocked. Unlock fee is due.', 'lead' => $lead]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $leads = Lead::with(['student:id,name', 'sourceAgency:id,name', 'assignedAgency:id,name', 'assignedInstitution:id,name'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->pool_type, fn ($q) => $q->where('pool_type', $request->pool_type))
            ->latest()
            ->paginate(20);

        return response()->json($leads);
    }

    public function assignAgency(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate(['agency_id' => 'required|exists:users,id']);
        $lead->update(['assigned_agency_id' => $validated['agency_id']]);
        return response()->json(['message' => 'Agency assigned.', 'lead' => $lead]);
    }

    public function updateStatus(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:new,profile_complete,under_review,shortlisted,interview_scheduled,interviewed,offer_received,accepted,visa_processing,visa_approved,visa_rejected,enrolled,closed,on_hold',
        ]);

        $previousStatus = $lead->status;
        $lead->update(['status' => $validated['status']]);

        // Auto-create affiliate commission when lead enrolls for the first time
        if ($validated['status'] === 'enrolled' && $previousStatus !== 'enrolled') {
            $student = $lead->student ?? User::find($lead->student_id);
            if ($student?->referred_by) {
                $affiliate = User::find($student->referred_by);
                if ($affiliate?->isAffiliate()) {
                    $affiliateProfile = AffiliateProfile::firstWhere('user_id', $affiliate->id);
                    $amount = $affiliateProfile?->local_commission_fixed ?? 0;

                    if ($amount > 0) {
                        Commission::create([
                            'lead_id'   => $lead->id,
                            'type'      => 'affiliate_associate',
                            'payer_id'  => (int) config('app.platform_admin_id', 1),
                            'payee_id'  => $affiliate->id,
                            'amount'    => $amount,
                            'currency'  => 'BDT',
                            'status'    => 'due',
                        ]);

                        // Update affiliate's pending_payout
                        if ($affiliateProfile) {
                            $affiliateProfile->increment('pending_payout', $amount);
                            $affiliateProfile->increment('converted_referrals');
                        }

                        TensaiNotification::create([
                            'user_id'    => $affiliate->id,
                            'type'       => 'commission_due',
                            'title'      => 'Commission Earned',
                            'body'       => "A student you referred has enrolled. ৳{$amount} commission is now due.",
                            'data'       => ['lead_id' => $lead->id, 'amount' => $amount],
                            'action_url' => '/dashboard/affiliate/commissions',
                        ]);
                    }
                }
            }

            // Notify student
            TensaiNotification::create([
                'user_id'    => $lead->student_id,
                'type'       => 'lead_enrolled',
                'title'      => 'Enrollment Confirmed',
                'body'       => "Congratulations! Your enrollment for {$lead->target_country} has been confirmed.",
                'data'       => ['lead_id' => $lead->id, 'lead_code' => $lead->lead_code],
                'action_url' => '/dashboard/student/leads',
            ]);
        }

        // Notify student on any status change (except terminal→terminal)
        if ($validated['status'] !== $previousStatus && $validated['status'] !== 'enrolled') {
            $statusLabels = [
                'shortlisted'         => 'Your application has been shortlisted!',
                'interview_scheduled' => 'Your interview has been scheduled.',
                'interviewed'         => 'Interview completed. Results coming soon.',
                'offer_received'      => 'You have received an offer!',
                'accepted'            => 'Your application has been accepted!',
                'visa_processing'     => 'Your visa is being processed.',
                'visa_approved'       => 'Your visa has been approved!',
                'visa_rejected'       => 'Your visa application was not successful.',
            ];
            if (isset($statusLabels[$validated['status']])) {
                TensaiNotification::create([
                    'user_id'    => $lead->student_id,
                    'type'       => 'lead_status_changed',
                    'title'      => 'Application Update',
                    'body'       => $statusLabels[$validated['status']],
                    'data'       => ['lead_id' => $lead->id, 'status' => $validated['status']],
                    'action_url' => '/dashboard/student/leads',
                ]);
            }
        }

        return response()->json(['message' => 'Status updated.', 'lead' => $lead]);
    }
}
