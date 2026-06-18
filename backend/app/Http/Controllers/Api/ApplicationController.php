<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\FormTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    // GET /api/applications
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $q    = Application::with(['formTemplate:id,name,country', 'documents'])->latest();

        if ($user->hasRole(['super_admin', 'admin'])) {
            // see all
        } elseif ($user->hasRole(['branch_admin', 'branch_manager'])) {
            $q->where('branch_id', $user->branch_id);
        } else {
            // agency / student — own only
            $q->where('user_id', $user->id);
        }

        $status = $request->query('status');
        if ($status) $q->where('status', $status);

        return response()->json($q->paginate(30));
    }

    // POST /api/applications
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'form_template_id' => 'required|exists:form_templates,id',
            'student_name'     => 'required|string|max:255',
            'student_email'    => 'nullable|email|max:255',
            'student_phone'    => 'nullable|string|max:50',
        ]);

        // Student: only 1 application allowed
        if ($user->hasRole('student')) {
            $existing = Application::where('user_id', $user->id)->first();
            if ($existing) {
                return response()->json(['message' => 'You already have an application.', 'application' => $this->format($existing)], 200);
            }
        }

        $template = FormTemplate::where('id', $data['form_template_id'])
            ->where('status', 'published')->where('is_active', true)->firstOrFail();

        $app = Application::create([
            'form_template_id'  => $template->id,
            'user_id'           => $user->id,
            'submitted_by_role' => $this->roleOf($user),
            'branch_id'         => $user->hasRole(['branch_admin', 'branch_manager']) ? $user->branch_id : null,
            'student_name'      => $data['student_name'],
            'student_email'     => $data['student_email'] ?? null,
            'student_phone'     => $data['student_phone'] ?? null,
            'form_data'         => [],
            'progress'          => 0,
            'status'            => 'draft',
        ]);

        return response()->json(['application' => $this->format($app)], 201);
    }

    // GET /api/applications/{id}
    public function show(Request $request, int $id): JsonResponse
    {
        $app = $this->findOwned($request, $id);
        return response()->json($this->format($app));
    }

    // PATCH /api/applications/{id}
    public function update(Request $request, int $id): JsonResponse
    {
        $app = $this->findOwned($request, $id);

        if ($app->status === 'submitted') {
            return response()->json(['message' => 'Cannot edit a submitted application.'], 422);
        }

        $data = $request->validate([
            'student_name'  => 'sometimes|string|max:255',
            'student_email' => 'sometimes|nullable|email|max:255',
            'student_phone' => 'sometimes|nullable|string|max:50',
            'form_data'     => 'sometimes|array',
        ]);

        if (isset($data['form_data'])) {
            $app->form_data = array_merge($app->form_data ?? [], $data['form_data']);
            unset($data['form_data']);
        }

        $app->fill($data);
        $app->progress = $app->recalculateProgress();
        $app->save();

        return response()->json($this->format($app));
    }

    // POST /api/applications/{id}/submit
    public function submit(Request $request, int $id): JsonResponse
    {
        $app = $this->findOwned($request, $id);

        if ($app->status !== 'draft') {
            return response()->json(['message' => 'Already submitted.'], 422);
        }
        if ($app->progress < 50) {
            return response()->json(['message' => 'Progress must be at least 50% to submit.'], 422);
        }

        $app->update(['status' => 'submitted', 'submitted_at' => now()]);

        return response()->json($this->format($app));
    }

    // POST /api/applications/{id}/documents
    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $app = $this->findOwned($request, $id);
        $request->validate(['file' => 'required|file|max:10240', 'doc_type' => 'required|string', 'field_key' => 'nullable|string', 'label' => 'nullable|string']);

        $file     = $request->file('file');
        $file     = $this->maybeCompressImage($file);
        $disk     = app()->environment('production') ? 'r2' : 'public';
        $path     = $file->store("applications/{$app->id}", $disk);
        $docType  = $request->input('doc_type');

        // Replace existing doc for same doc_type
        $existing = ApplicationDocument::where('application_id', $app->id)->where('doc_type', $docType)->first();
        if ($existing) {
            try { Storage::disk($disk)->delete($existing->file_path); } catch (\Throwable) {}
            $existing->delete();
        }

        $doc = ApplicationDocument::create([
            'application_id' => $app->id,
            'doc_type'       => $docType,
            'field_key'      => $request->input('field_key') ?? $docType,
            'label'          => $request->input('label', $docType),
            'file_path'      => $path,
            'original_name'  => $file->getClientOriginalName(),
            'file_size'      => $file->getSize(),
            'mime_type'      => $file->getMimeType(),
        ]);

        $app->progress = $app->fresh()->recalculateProgress();
        $app->save();

        return response()->json(['document' => $doc->append('url'), 'progress' => $app->progress]);
    }

    // DELETE /api/applications/{id}/documents/{docId}
    public function deleteDocument(Request $request, int $id, int $docId): JsonResponse
    {
        $app = $this->findOwned($request, $id);
        $doc = ApplicationDocument::where('application_id', $app->id)->findOrFail($docId);

        $disk = app()->environment('production') ? 'r2' : 'public';
        try { Storage::disk($disk)->delete($doc->file_path); } catch (\Throwable) {}
        $doc->delete();

        $app->progress = $app->fresh()->recalculateProgress();
        $app->save();

        return response()->json(['progress' => $app->progress]);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function findOwned(Request $request, int $id): Application
    {
        $user = $request->user();
        $q    = Application::with(['formTemplate', 'documents'])->where('id', $id);

        if ($user->hasRole(['super_admin', 'admin'])) {
            // unrestricted
        } elseif ($user->hasRole(['branch_admin', 'branch_manager'])) {
            $q->where('branch_id', $user->branch_id);
        } else {
            $q->where('user_id', $user->id);
        }

        return $q->firstOrFail();
    }

    private function roleOf($user): string
    {
        if ($user->hasRole(['super_admin', 'admin'])) return 'admin';
        if ($user->hasRole(['branch_admin', 'branch_manager'])) return 'branch_admin';
        if ($user->hasRole('agency')) return 'agency';
        return 'student';
    }

    private function format(Application $app): array
    {
        $app->load(['formTemplate:id,name,country,intake_options', 'documents']);
        return [
            'id'                => $app->id,
            'application_code'  => $app->application_code,
            'form_template_id'  => $app->form_template_id,
            'form_template'     => $app->formTemplate ? [
                'id'             => $app->formTemplate->id,
                'name'           => $app->formTemplate->name,
                'country'        => $app->formTemplate->country,
                'intake_options' => $app->formTemplate->intake_options ?? [],
            ] : null,
            'user_id'           => $app->user_id,
            'submitted_by_role' => $app->submitted_by_role,
            'branch_id'         => $app->branch_id,
            'student_name'      => $app->student_name,
            'student_email'     => $app->student_email,
            'student_phone'     => $app->student_phone,
            'form_data'         => $app->form_data ?? [],
            'progress'          => $app->progress,
            'status'            => $app->status,
            'submitted_at'      => $app->submitted_at?->toISOString(),
            'created_at'        => $app->created_at->toISOString(),
            'updated_at'        => $app->updated_at->toISOString(),
            'documents'         => $app->documents->map(fn ($d) => [
                'id'            => $d->id,
                'doc_type'      => $d->doc_type,
                'field_key'     => $d->field_key,
                'label'         => $d->label,
                'url'           => $d->url,
                'original_name' => $d->original_name,
                'file_size'     => $d->file_size,
                'mime_type'     => $d->mime_type,
            ])->values()->toArray(),
        ];
    }

    private function maybeCompressImage($file)
    {
        // return as-is; actual compression done client-side
        return $file;
    }
}