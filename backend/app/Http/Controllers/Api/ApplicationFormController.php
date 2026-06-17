<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApplicationDocument;
use App\Models\ApplicationForm;
use App\Models\Lead;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ApplicationFormController extends Controller
{
    private function branchId(Request $request): int
    {
        $id = $request->user()->branch_id;
        if (!$id) abort(403, 'Not assigned to a branch.');
        return $id;
    }

    // GET /branch-admin/application-forms
    public function index(Request $request): JsonResponse
    {
        $branchId = $this->branchId($request);

        $forms = ApplicationForm::with(['lead.student:id,name,email,phone', 'documents'])
            ->where('branch_id', $branchId)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($f) => $this->formatForm($f));

        return response()->json($forms);
    }

    // GET /branch-admin/application-forms/{id}
    public function show(Request $request, int $id): JsonResponse
    {
        $form = ApplicationForm::with(['lead.student:id,name,email,phone', 'documents'])
            ->where('branch_id', $this->branchId($request))
            ->findOrFail($id);

        return response()->json($this->formatForm($form));
    }

    // POST /branch-admin/application-forms
    // Creates lead + application form together
    public function store(Request $request): JsonResponse
    {
        $branchId = $this->branchId($request);

        $validated = $request->validate([
            'student_name'    => 'required|string|max:255',
            'student_email'   => 'required|email|max:255',
            'student_phone'   => 'required|string|max:30',
            'target_country'  => 'required|string|max:100',
            'target_course'   => 'nullable|string|max:255',
            'target_intake'   => 'nullable|date',
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
            return response()->json(['message' => 'An application already exists for this student from your branch.'], 422);
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

        $form = ApplicationForm::create([
            'lead_id'   => $lead->id,
            'branch_id' => $branchId,
            'progress'  => 0,
            'status'    => 'draft',
        ]);

        $form->recalculateProgress();
        $form->load(['lead.student:id,name,email,phone', 'documents']);

        return response()->json($this->formatForm($form), 201);
    }

    // PATCH /branch-admin/application-forms/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $form = ApplicationForm::with(['lead.student', 'documents'])
            ->where('branch_id', $this->branchId($request))
            ->findOrFail($id);

        $validated = $request->validate([
            // Personal
            'date_of_birth'      => 'nullable|date',
            'gender'             => 'nullable|in:male,female,other',
            'nationality'        => 'nullable|string|max:100',
            'address'            => 'nullable|string|max:500',
            'passport_number'    => 'nullable|string|max:50',
            'passport_expiry'    => 'nullable|date',
            // Academic
            'last_qualification' => 'nullable|string|max:100',
            'institution_name'   => 'nullable|string|max:255',
            'board_university'   => 'nullable|string|max:255',
            'gpa_grade'          => 'nullable|string|max:20',
            'passing_year'       => 'nullable|integer|min:1990|max:2030',
            // Language
            'jlpt_level'         => 'nullable|in:N1,N2,N3,N4,N5,None,Preparing',
            'jlpt_score'         => 'nullable|string|max:20',
            'jlpt_exam_date'     => 'nullable|date',
            'english_proficiency'=> 'nullable|in:IELTS,TOEFL,Duolingo,None',
            'english_score'      => 'nullable|string|max:20',
            // Study
            'preferred_institution' => 'nullable|string|max:255',
            'preferred_cities'   => 'nullable|array',
            'target_country'     => 'nullable|string|max:100',
            'target_course'      => 'nullable|string|max:255',
            'target_intake'      => 'nullable|date',
            // Sponsor
            'sponsor_name'         => 'nullable|string|max:255',
            'sponsor_relationship' => 'nullable|string|max:100',
            'sponsor_occupation'   => 'nullable|string|max:255',
            'sponsor_monthly_income' => 'nullable|string|max:50',
            // Custom template fields stored as JSON
            'custom_data'          => 'nullable|array',
        ]);

        // Update lead fields if provided
        $leadFields = array_intersect_key($validated, array_flip(['target_country', 'target_course', 'target_intake']));
        if ($leadFields) {
            $form->lead->update($leadFields);
        }

        // Update phone/name on student if provided
        if ($request->has('student_phone')) {
            $form->lead->student?->update(['phone' => $request->student_phone]);
        }

        $formFields = array_diff_key($validated, array_flip(['target_country', 'target_course', 'target_intake']));
        $form->update($formFields);

        $form->recalculateProgress();
        $form->load(['lead.student:id,name,email,phone', 'documents']);

        return response()->json($this->formatForm($form));
    }

    // POST /branch-admin/application-forms/{id}/submit
    public function submit(Request $request, int $id): JsonResponse
    {
        $form = ApplicationForm::with(['lead', 'documents'])
            ->where('branch_id', $this->branchId($request))
            ->findOrFail($id);

        if ($form->status === 'submitted') {
            return response()->json(['message' => 'Already submitted.'], 422);
        }

        $progress = $form->recalculateProgress();
        if ($progress < 50) {
            return response()->json(['message' => "Progress is {$progress}%. Minimum 50% required to submit."], 422);
        }

        $form->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
        ]);

        // Also mark the lead as submitted so super admin can see it
        $form->lead->update(['submission_status' => 'submitted']);

        return response()->json(['message' => 'Application submitted successfully.', 'form' => $this->formatForm($form->fresh(['lead.student', 'documents']))]);
    }

    // POST /branch-admin/application-forms/{id}/documents
    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $form = ApplicationForm::where('branch_id', $this->branchId($request))->findOrFail($id);

        $request->validate([
            'doc_type' => 'required|string|max:100|regex:/^[a-z0-9_]+$/',
            'label'    => 'required|string|max:100',
            'file'     => 'required|file|max:4096|mimes:jpeg,jpg,png,webp,pdf',
        ]);

        $disk = app()->environment('production') ? 'r2' : 'public';
        $path = $request->file('file')->store("application-docs/{$form->branch_id}/{$form->id}", $disk);

        // Replace existing doc of same type (one per type)
        $existing = ApplicationDocument::where('application_form_id', $form->id)
            ->where('doc_type', $request->doc_type)
            ->first();
        if ($existing) {
            Storage::disk($disk)->delete($existing->file_path);
            $existing->update([
                'label'         => $request->label,
                'file_path'     => $path,
                'original_name' => $request->file('file')->getClientOriginalName(),
                'file_size'     => $request->file('file')->getSize(),
                'mime_type'     => $request->file('file')->getMimeType(),
            ]);
            $doc = $existing->fresh();
        } else {
            $doc = ApplicationDocument::create([
                'application_form_id' => $form->id,
                'doc_type'     => $request->doc_type,
                'label'        => $request->label,
                'file_path'    => $path,
                'original_name'=> $request->file('file')->getClientOriginalName(),
                'file_size'    => $request->file('file')->getSize(),
                'mime_type'    => $request->file('file')->getMimeType(),
            ]);
        }

        $form->recalculateProgress();

        return response()->json(['document' => $doc, 'progress' => $form->fresh()->progress], 201);
    }

    // DELETE /branch-admin/application-forms/{id}/documents/{docId}
    public function deleteDocument(Request $request, int $id, int $docId): JsonResponse
    {
        $form = ApplicationForm::where('branch_id', $this->branchId($request))->findOrFail($id);
        $doc  = ApplicationDocument::where('application_form_id', $form->id)->findOrFail($docId);

        $disk = app()->environment('production') ? 'r2' : 'public';
        Storage::disk($disk)->delete($doc->file_path);
        $doc->delete();

        $form->recalculateProgress();

        return response()->json(['message' => 'Document deleted.', 'progress' => $form->fresh()->progress]);
    }

    private function formatForm(ApplicationForm $form): array
    {
        $lead    = $form->lead;
        $student = $lead?->student;

        return [
            'id'                   => $form->id,
            'lead_id'              => $form->lead_id,
            'lead_code'            => $lead?->lead_code,
            'status'               => $form->status,
            'progress'             => $form->progress,
            'submitted_at'         => $form->submitted_at,
            'created_at'           => $form->created_at,
            'updated_at'           => $form->updated_at,
            // Student
            'student_name'         => $student?->name,
            'student_email'        => $student?->email,
            'student_phone'        => $student?->phone,
            // Personal
            'date_of_birth'        => $form->date_of_birth?->toDateString(),
            'gender'               => $form->gender,
            'nationality'          => $form->nationality,
            'address'              => $form->address,
            'passport_number'      => $form->passport_number,
            'passport_expiry'      => $form->passport_expiry?->toDateString(),
            // Academic
            'last_qualification'   => $form->last_qualification,
            'institution_name'     => $form->institution_name,
            'board_university'     => $form->board_university,
            'gpa_grade'            => $form->gpa_grade,
            'passing_year'         => $form->passing_year,
            // Language
            'jlpt_level'           => $form->jlpt_level,
            'jlpt_score'           => $form->jlpt_score,
            'jlpt_exam_date'       => $form->jlpt_exam_date?->toDateString(),
            'english_proficiency'  => $form->english_proficiency,
            'english_score'        => $form->english_score,
            // Study
            'target_country'       => $lead?->target_country,
            'target_course'        => $lead?->target_course,
            'target_intake'        => $lead?->target_intake ? substr($lead->target_intake, 0, 10) : null,
            'preferred_institution'=> $form->preferred_institution,
            'preferred_cities'     => $form->preferred_cities ?? [],
            // Sponsor
            'sponsor_name'         => $form->sponsor_name,
            'sponsor_relationship' => $form->sponsor_relationship,
            'sponsor_occupation'   => $form->sponsor_occupation,
            'sponsor_monthly_income' => $form->sponsor_monthly_income,
            // Custom fields (dynamic template fields)
            'custom_data'          => $form->custom_data ?? [],
            // Documents
            'documents'            => $form->documents->map(fn($d) => [
                'id'            => $d->id,
                'doc_type'      => $d->doc_type,
                'label'         => $d->label,
                'url'           => $d->url,
                'original_name' => $d->original_name,
                'file_size'     => $d->file_size,
                'mime_type'     => $d->mime_type,
            ])->values(),
        ];
    }
}
