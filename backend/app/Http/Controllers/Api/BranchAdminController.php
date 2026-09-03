<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PaymentReceiptMail;
use App\Models\Application;
use App\Models\Branch;
use App\Models\BranchTeamMember;
use App\Models\FundTransfer;
use App\Models\GalleryItem;
use App\Models\InstitutionSelection;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\PaymentCategory;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BranchAdminController extends Controller
{
    private function branch(Request $request): Branch
    {
        $branchId = $request->user()->branch_id;
        if (!$branchId) abort(403, 'You are not assigned to a branch.');
        return Branch::findOrFail($branchId);
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    public function getSettings(Request $request): JsonResponse
    {
        $b = $this->branch($request);
        return response()->json($b->only([
            'id', 'name', 'slug', 'tagline', 'description',
            'city', 'country', 'address', 'phone', 'phone_2', 'email', 'whatsapp',
            'google_maps_url', 'working_hours', 'social_links', 'stats',
            'logo_url', 'cover_image_url', 'is_active',
        ]));
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tagline'         => 'nullable|string|max:255',
            'description'     => 'nullable|string',
            'address'         => 'nullable|string|max:500',
            'phone'           => 'nullable|string|max:30',
            'phone_2'         => 'nullable|string|max:30',
            'email'           => 'nullable|email|max:100',
            'whatsapp'        => 'nullable|string|max:30',
            'google_maps_url' => 'nullable|url|max:500',
            'working_hours'   => 'nullable|array',
            'social_links'    => 'nullable|array',
            'logo'            => 'nullable|image|max:2048',
            'cover_image'     => 'nullable|image|max:8192',
        ]);

        $b = $this->branch($request);
        $disk = app()->environment('production') ? 'r2' : 'public';

        if ($request->hasFile('logo')) {
            if ($b->logo) Storage::disk($disk)->delete($b->logo);
            $validated['logo'] = $request->file('logo')->store('branch-logos', $disk);
        } else {
            unset($validated['logo']);
        }

        if ($request->hasFile('cover_image')) {
            if ($b->cover_image) Storage::disk($disk)->delete($b->cover_image);
            $validated['cover_image'] = $request->file('cover_image')->store('branch-covers', $disk);
        } else {
            unset($validated['cover_image']);
        }

        $b->update($validated);

        return response()->json(['message' => 'Settings updated.', 'branch' => $b->fresh()]);
    }

    // ── Selected Applications (institution selections for this branch's students) ──

    public function selectedApplications(Request $request): JsonResponse
    {
        $branchId = $request->user()->branch_id;
        if (!$branchId) abort(403, 'You are not assigned to a branch.');

        $selections = InstitutionSelection::whereHas('lead', fn ($q) => $q->where('branch_id', $branchId))
            ->with([
                'lead.formTemplate:id,name,country',
                'lead.user:id,name',
                'lead.user.studentProfile:id,user_id,highest_qualification,gpa',
                'institution:id,name',
                'institution.institutionProfile:id,user_id,country',
            ])
            ->whereNotIn('status', ['cancelled'])
            ->latest('selected_at')
            ->get();

        $data = $selections->map(function (InstitutionSelection $sel) {
            $app  = $sel->lead;
            $sp   = $app?->user?->studentProfile;
            $inst = $sel->institution;
            return [
                'id'                 => $sel->id,
                'lead_code'          => $app?->application_code,
                'target_country'     => $app?->formTemplate?->country,
                'target_city'        => $app?->target_city ?? null,
                'target_course'      => $app?->target_course ?? null,
                'target_intake'      => $app?->target_intake ? $app->target_intake->toDateString() : null,
                'last_education'     => $sp?->highest_qualification,
                'gpa'                => $sp?->gpa,
                'selected_at'        => $sel->selected_at,
                'updated_at'         => $sel->updated_at,
                'status'             => $sel->status,
                'student_name'       => $app?->user?->name,
                'institution_name'   => $inst?->name,
                'institution_country'=> $inst?->institutionProfile?->country,
                'connect_name'       => $sel->connect_name,
                'connect_email'      => $sel->connect_email,
                'connect_whatsapp'   => $sel->connect_whatsapp,
                'connect_phone'      => $sel->connect_phone,
            ];
        });

        return response()->json(['data' => $data]);
    }

    // ── Leads ─────────────────────────────────────────────────────────────────

    public function leads(Request $request): JsonResponse
    {
        $branchId = $request->user()->branch_id;

        $leads = Lead::where('source_branch_id', $branchId)
            ->with(['student:id,name,email'])
            ->when($request->submission_status, fn ($q, $s) => $q->where('submission_status', $s))
            ->orderByDesc('created_at')
            ->get(['id', 'lead_code', 'student_id', 'status', 'submission_status',
                   'target_country', 'target_course', 'target_intake', 'created_at']);

        return response()->json($leads);
    }

    public function showLead(Request $request, int $id): JsonResponse
    {
        $branchId = $request->user()->branch_id;
        if (!$branchId) abort(403, 'You are not assigned to a branch.');

        $lead = Lead::where('id', $id)
            ->where('source_branch_id', $branchId)
            ->with(['student:id,name,email,phone'])
            ->firstOrFail();

        return response()->json($lead);
    }

    public function updateLead(Request $request, int $id): JsonResponse
    {
        $branchId = $request->user()->branch_id;
        if (!$branchId) abort(403, 'You are not assigned to a branch.');

        $lead = Lead::where('id', $id)
            ->where('source_branch_id', $branchId)
            ->firstOrFail();

        if ($lead->submission_status === 'accepted') {
            return response()->json(['message' => 'Cannot edit an accepted applicant.'], 422);
        }

        $validated = $request->validate([
            'target_country'              => 'sometimes|nullable|string|max:100',
            'target_course'               => 'nullable|string|max:255',
            'target_intake'               => 'nullable|date',
            'preferred_cities'            => 'nullable|array',
            'preferred_cities.*'          => 'string|max:100',
            'city_type'                   => 'nullable|in:preferred,must',
            'preferred_institution'       => 'nullable|string|max:255',
            'jlpt_nat_score'              => 'nullable|string|max:50',
            'jlpt_nat_result_date'        => 'nullable|date',
            'expected_jlpt_nat_exam_date' => 'nullable|date',
        ]);

        $lead->update($validated);

        return response()->json(['message' => 'Applicant updated.', 'lead' => $lead->fresh(['student:id,name,email,phone'])]);
    }

    public function submitLead(Request $request, int $id): JsonResponse
    {
        $branchId = $request->user()->branch_id;
        if (!$branchId) abort(403, 'You are not assigned to a branch.');

        $lead = Lead::where('id', $id)
            ->where('source_branch_id', $branchId)
            ->firstOrFail();

        if ($lead->submission_status !== 'draft') {
            return response()->json(['message' => 'Only draft applicants can be submitted.'], 422);
        }

        $lead->update(['submission_status' => 'submitted']);

        return response()->json(['message' => 'Applicant submitted for admin review.', 'lead' => $lead->fresh()]);
    }

    public function storeLead(Request $request): JsonResponse
    {
        $branchId = $request->user()->branch_id;
        if (!$branchId) abort(403, 'You are not assigned to a branch.');

        $validated = $request->validate([
            'student_name'   => 'required|string|max:255',
            'student_email'  => 'required|email|max:255',
            'student_phone'  => 'required|string|max:20',
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
                'phone'          => $validated['student_phone'],
                'password'       => Hash::make(Str::random(16)),
                'gateway_type'   => 'student',
                'status'         => 'pending',
                'affiliate_code' => 'TEN-' . strtoupper(Str::random(8)),
            ]);
            $student->assignRole('student');
            StudentProfile::create(['user_id' => $student->id]);
        }

        $exists = Lead::where('student_id', $student->id)
            ->where('source_branch_id', $branchId)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'An applicant record already exists for this student from your branch.'], 422);
        }

        $lead = Lead::create([
            'student_id'        => $student->id,
            'source_branch_id'  => $branchId,
            'pool_type'         => 'private',
            'status'            => 'new',
            'submission_status' => 'draft',
            'target_country'    => $validated['target_country'],
            'target_course'     => $validated['target_course'] ?? null,
            'target_intake'     => $validated['target_intake'] ?? null,
        ]);

        return response()->json([
            'message' => 'Applicant added.',
            'lead'    => $lead->load('student:id,name,email'),
        ], 201);
    }

    // ── Team ──────────────────────────────────────────────────────────────────

    public function team(Request $request): JsonResponse
    {
        $members = BranchTeamMember::where('branch_id', $request->user()->branch_id)
            ->orderBy('sort_order')
            ->get();
        return response()->json($members);
    }

    public function storeTeamMember(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:100',
            'role'       => 'required|string|max:100',
            'bio'        => 'nullable|string',
            'email'      => 'nullable|email|max:100',
            'phone'      => 'nullable|string|max:30',
            'photo'      => 'nullable|image|max:4096',
            'sort_order' => 'nullable|integer',
            'is_active'  => 'boolean',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            $photoPath = $request->file('photo')->store('branch-team', $disk);
        }

        $member = BranchTeamMember::create(array_merge(
            array_diff_key($validated, ['photo' => null]),
            [
                'branch_id' => $request->user()->branch_id,
                'photo'     => $photoPath,
            ]
        ));

        return response()->json($member, 201);
    }

    public function updateTeamMember(Request $request, int $id): JsonResponse
    {
        $member = BranchTeamMember::where('branch_id', $request->user()->branch_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'role'       => 'sometimes|string|max:100',
            'bio'        => 'nullable|string',
            'email'      => 'nullable|email|max:100',
            'phone'      => 'nullable|string|max:30',
            'photo'      => 'nullable|image|max:4096',
            'sort_order' => 'nullable|integer',
            'is_active'  => 'boolean',
        ]);

        if ($request->hasFile('photo')) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            if ($member->photo) Storage::disk($disk)->delete($member->photo);
            $member->photo = $request->file('photo')->store('branch-team', $disk);
        }

        $member->fill(array_diff_key($validated, ['photo' => null]));
        $member->save();

        return response()->json($member->fresh());
    }

    public function deleteTeamMember(Request $request, int $id): JsonResponse
    {
        $member = BranchTeamMember::where('branch_id', $request->user()->branch_id)
            ->findOrFail($id);

        if ($member->photo) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            Storage::disk($disk)->delete($member->photo);
        }

        $member->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    // ── Gallery ───────────────────────────────────────────────────────────────

    public function gallery(Request $request): JsonResponse
    {
        $items = GalleryItem::where('branch_id', $request->user()->branch_id)
            ->orderBy('sort_order')
            ->get();
        return response()->json($items);
    }

    public function storeGallery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|max:8192',
            'image_url'   => 'nullable|url',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'boolean',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            $imagePath = $request->file('image')->store('gallery', $disk);
        }

        // Branch-sourced items intentionally leave category/is_featured unset —
        // those stay admin-curated concerns on the unified GalleryItem table.
        $item = GalleryItem::create([
            'branch_id'   => $request->user()->branch_id,
            'title'       => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'image_path'  => $imagePath,
            'image_url'   => !$imagePath ? ($validated['image_url'] ?? null) : null,
            'sort_order'  => $validated['sort_order'] ?? 0,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json($item->fresh(), 201);
    }

    public function updateGallery(Request $request, int $id): JsonResponse
    {
        $item = GalleryItem::where('branch_id', $request->user()->branch_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|max:8192',
            'image_url'   => 'nullable|url',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            if ($item->image_path) Storage::disk($disk)->delete($item->image_path);
            $item->image_path = $request->file('image')->store('gallery', $disk);
            $item->image_url  = null;
        } elseif (!empty($validated['image_url'])) {
            $item->image_url  = $validated['image_url'];
            $item->image_path = null;
        }

        $item->fill(array_intersect_key($validated, array_flip(['title', 'description', 'sort_order', 'is_active'])));
        $item->save();

        return response()->json($item->fresh());
    }

    public function deleteGallery(Request $request, int $id): JsonResponse
    {
        $item = GalleryItem::where('branch_id', $request->user()->branch_id)
            ->findOrFail($id);

        if ($item->image_path) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            Storage::disk($disk)->delete($item->image_path);
        }

        $item->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    // ── Payments (auto-split, zero-waiting-time entry) ──────────────────────────

    public function paymentCategories(Request $request): JsonResponse
    {
        return response()->json(PaymentCategory::active()->get(['id', 'key', 'label', 'fund_target']));
    }

    public function payments(Request $request): JsonResponse
    {
        $branch = $this->branch($request);

        $payments = Payment::where('branch_id', $branch->id)
            ->with(['category:id,label', 'application:id,application_code'])
            ->latest()
            ->paginate(20);

        return response()->json($payments);
    }

    public function showPayment(Request $request, int $id): JsonResponse
    {
        $branch = $this->branch($request);

        $payment = Payment::where('branch_id', $branch->id)
            ->with(['category', 'application', 'receiver:id,name'])
            ->findOrFail($id);

        return response()->json($payment);
    }

    public function storePayment(Request $request): JsonResponse
    {
        $branch = $this->branch($request);

        $validated = $request->validate([
            'application_id'      => 'nullable|integer|exists:applications,id',
            'payment_category_id' => 'required|integer|exists:payment_categories,id',
            'total_amount'         => 'required|numeric|min:1',
            // Amount actually collected right now — defaults to the full total
            // (the original "always paid in full" behaviour) when omitted.
            // 0 is valid: a pure due invoice with nothing collected yet.
            'amount'               => 'nullable|numeric|min:0|lte:total_amount',
            'currency'             => 'nullable|string|size:3',
            'method'               => 'required|in:cash,bank',
            'customer_name'        => 'required_without:application_id|nullable|string|max:255',
            'customer_phone'       => 'nullable|string|max:30',
            'customer_email'       => 'nullable|email|max:255',
            'notes'                => 'nullable|string|max:1000',
        ]);

        // If an application is not linked to this branch, reject rather than
        // silently attributing another branch's applicant to this payment.
        $application = null;
        if (!empty($validated['application_id'])) {
            $application = Application::where('id', $validated['application_id'])
                ->where('branch_id', $branch->id)
                ->first();
            if (!$application) {
                return response()->json(['message' => 'That application does not belong to your branch.'], 422);
            }
        }

        $category = PaymentCategory::findOrFail($validated['payment_category_id']);

        // Re-check active status server-side — the branch dropdown caches for
        // 5 minutes, so a category deactivated by head office in that window
        // must still be rejected rather than silently accepted.
        if (!$category->is_active) {
            return response()->json(['message' => 'This memo category is no longer active. Please refresh and pick another.'], 422);
        }

        $payment = Payment::create([
            'application_id'       => $application?->id,
            'branch_id'            => $branch->id,
            'payment_category_id'  => $category->id,
            'fund_target'          => $category->fund_target, // snapshot — see Payment/migration notes
            'total_amount'         => $validated['total_amount'],
            'amount'               => $validated['amount'] ?? $validated['total_amount'],
            'currency'             => $validated['currency'] ?? 'BDT',
            'method'               => $validated['method'],
            'customer_name'        => $validated['customer_name'] ?? $application?->student_name,
            'customer_phone'       => $validated['customer_phone'] ?? $application?->student_phone,
            'customer_email'       => $validated['customer_email'] ?? $application?->student_email,
            'received_by'          => $request->user()->id,
            'notes'                => $validated['notes'] ?? null,
        ]);

        $payment->load(['category', 'branch', 'application']);

        // Instant receipt — no approval step sits between entry and delivery.
        // QUEUE_CONNECTION=sync by default, so this actually sends inline; see
        // the build plan's note on confirming that on the production env.
        if ($payment->customer_email) {
            Mail::to($payment->customer_email)->queue(new PaymentReceiptMail($payment));
        }

        return response()->json($payment, 201);
    }

    // Records an additional collection against a due/partial memo — the
    // counterpart to leaving `amount` short of `total_amount` at creation.
    public function collectPayment(Request $request, int $id): JsonResponse
    {
        $branch = $this->branch($request);

        $payment = Payment::where('branch_id', $branch->id)->findOrFail($id);

        if ($payment->status === 'paid') {
            return response()->json(['message' => 'This memo is already fully paid.'], 422);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $payment->due_amount],
        ]);

        $payment->collect((float) $validated['amount']);
        $payment->load(['category', 'branch', 'application']);

        if ($payment->customer_email) {
            Mail::to($payment->customer_email)->queue(new PaymentReceiptMail($payment));
        }

        return response()->json($payment);
    }

    // ── Fund Transfers (branch → head office settlement) ────────────────────────

    public function fundTransfers(Request $request): JsonResponse
    {
        $branch = $this->branch($request);

        $collected = Payment::where('branch_id', $branch->id)
            ->where('fund_target', 'head_office')
            ->sum('amount');

        $settled = FundTransfer::where('branch_id', $branch->id)
            ->where('status', 'received')
            ->sum('amount');

        $transfers = FundTransfer::where('branch_id', $branch->id)
            ->latest()
            ->get();

        return response()->json([
            'payable_balance' => round((float) $collected - (float) $settled, 2),
            'transfers'       => $transfers,
        ]);
    }

    public function storeFundTransfer(Request $request): JsonResponse
    {
        $branch = $this->branch($request);

        $validated = $request->validate([
            'amount'         => 'required|numeric|min:1',
            'currency'       => 'nullable|string|size:3',
            'period_from'    => 'nullable|date',
            'period_to'      => 'nullable|date',
            'bank_reference' => 'nullable|string|max:255',
            'notes'          => 'nullable|string|max:1000',
        ]);

        $transfer = FundTransfer::create([
            'branch_id'      => $branch->id,
            'amount'         => $validated['amount'],
            'currency'       => $validated['currency'] ?? 'BDT',
            'period_from'    => $validated['period_from'] ?? null,
            'period_to'      => $validated['period_to'] ?? null,
            'bank_reference' => $validated['bank_reference'] ?? null,
            'notes'          => $validated['notes'] ?? null,
            'status'         => 'pending',
        ]);

        return response()->json($transfer, 201);
    }
}
