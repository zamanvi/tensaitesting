<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\BranchGalleryItem;
use App\Models\BranchTeamMember;
use App\Models\Lead;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
            'city', 'country', 'address', 'phone', 'email', 'whatsapp',
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
            'whatsapp'        => 'nullable|string|max:30',
            'google_maps_url' => 'nullable|url|max:500',
            'working_hours'   => 'nullable|array',
            'social_links'    => 'nullable|array',
        ]);

        $b = $this->branch($request);
        $b->update($validated);

        return response()->json(['message' => 'Settings updated.', 'branch' => $b->fresh()]);
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
            'sort_order' => 'nullable|integer',
            'is_active'  => 'boolean',
        ]);

        $member = BranchTeamMember::create(array_merge($validated, [
            'branch_id' => $request->user()->branch_id,
        ]));

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
            'sort_order' => 'nullable|integer',
            'is_active'  => 'boolean',
        ]);

        $member->update($validated);
        return response()->json($member->fresh());
    }

    public function deleteTeamMember(Request $request, int $id): JsonResponse
    {
        BranchTeamMember::where('branch_id', $request->user()->branch_id)
            ->findOrFail($id)
            ->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    // ── Gallery ───────────────────────────────────────────────────────────────

    public function gallery(Request $request): JsonResponse
    {
        $items = BranchGalleryItem::where('branch_id', $request->user()->branch_id)
            ->orderBy('sort_order')
            ->get();
        return response()->json($items);
    }

    public function storeGallery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'caption'     => 'nullable|string|max:255',
            'image'       => 'nullable|image|max:8192',
            'image_url'   => 'nullable|url',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'boolean',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            $imagePath = $request->file('image')->store('branch-gallery', $disk);
        }

        $item = BranchGalleryItem::create([
            'branch_id'   => $request->user()->branch_id,
            'title'       => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'caption'     => $validated['caption'] ?? null,
            'image_path'  => $imagePath,
            'image_url'   => !$imagePath ? ($validated['image_url'] ?? null) : null,
            'sort_order'  => $validated['sort_order'] ?? 0,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json($item->fresh(), 201);
    }

    public function updateGallery(Request $request, int $id): JsonResponse
    {
        $item = BranchGalleryItem::where('branch_id', $request->user()->branch_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'caption'     => 'nullable|string|max:255',
            'image'       => 'nullable|image|max:8192',
            'image_url'   => 'nullable|url',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            if ($item->image_path) Storage::disk($disk)->delete($item->image_path);
            $item->image_path = $request->file('image')->store('branch-gallery', $disk);
            $item->image_url  = null;
        } elseif (!empty($validated['image_url'])) {
            $item->image_url  = $validated['image_url'];
            $item->image_path = null;
        }

        $item->fill(array_intersect_key($validated, array_flip(['title', 'description', 'caption', 'sort_order', 'is_active'])));
        $item->save();

        return response()->json($item->fresh());
    }

    public function deleteGallery(Request $request, int $id): JsonResponse
    {
        $item = BranchGalleryItem::where('branch_id', $request->user()->branch_id)
            ->findOrFail($id);

        if ($item->image_path) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            Storage::disk($disk)->delete($item->image_path);
        }

        $item->delete();
        return response()->json(['message' => 'Deleted.']);
    }
}
