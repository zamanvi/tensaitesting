<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OcrJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OcrController extends Controller
{
    /**
     * Upload a document for OCR processing.
     * Image resizing is attempted via Intervention Image (GD).
     * If that fails (e.g. extension missing on host), the original file
     * is stored as-is — the OCR job is always created successfully.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file'          => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'document_type' => 'required|in:passport,nid_student,ssc_certificate,ssc_marksheet,hsc_certificate,hsc_marksheet,degree_certificate,transcript,birth_certificate_student,father_birth_certificate,father_nid,mother_birth_certificate,mother_nid,student_photo,sponsor_photo,jlpt_certificate,jlpt_marksheet,nat_certificate,nat_marksheet,ielts_certificate',
        ]);

        $user    = $request->user();
        $profile = $user->studentProfile;

        if (! $profile) {
            return response()->json(['message' => 'Student profile not found.'], 404);
        }

        // Choose disk based on environment
        $disk     = app()->environment('production') ? 'r2' : 'public';
        $uploaded = $request->file('file');
        $mime     = $uploaded->getMimeType();
        $folder   = "ocr/{$user->id}/{$request->document_type}";
        $path     = null;

        // ── Image processing (GD resize + convert to JPEG) ─────────────────
        if (in_array($mime, ['image/jpeg', 'image/png', 'image/jpg'])) {
            try {
                if (! extension_loaded('gd') && ! extension_loaded('imagick')) {
                    throw new \RuntimeException('Neither GD nor Imagick extension is available.');
                }

                // Lazy-load facade so missing config doesn't crash boot
                $imageClass = 'Intervention\\Image\\Laravel\\Facades\\Image';
                /** @var \Intervention\Image\Image $img */
                $img      = $imageClass::read($uploaded->getRealPath())->scaleDown(1200, 1200);
                $filename = Str::uuid() . '.jpg';
                $tmpPath  = sys_get_temp_dir() . '/' . $filename;
                $img->toJpeg(82)->save($tmpPath);

                Storage::disk($disk)->putFileAs(
                    $folder,
                    new \Illuminate\Http\File($tmpPath),
                    $filename
                );

                @unlink($tmpPath);
                $path = $folder . '/' . $filename;

            } catch (\Throwable $e) {
                // Image library unavailable — store original file unchanged
                Log::warning('OCR image resize failed, storing original.', [
                    'error'  => $e->getMessage(),
                    'user'   => $user->id,
                    'type'   => $request->document_type,
                ]);
                $path = null; // will fall through to raw store below
            }
        }

        // ── Raw store (PDF or image fallback) ──────────────────────────────
        if ($path === null) {
            $path = $uploaded->store($folder, $disk);
        }

        if (! $path) {
            return response()->json(['message' => 'File storage failed. Please try again.'], 500);
        }

        // ── Create OCR job ─────────────────────────────────────────────────
        $job = OcrJob::create([
            'user_id'            => $user->id,
            'student_profile_id' => $profile->id,
            'document_type'      => $request->document_type,
            'original_file'      => $path,
            'status'             => 'queued',
        ]);

        return response()->json([
            'message' => 'Document uploaded. OCR processing queued.',
            'job_id'  => $job->id,
            'status'  => $job->status,
        ], 201);
    }

    public function requestReview(Request $request): JsonResponse
    {
        $request->validate(['job_id' => 'required|exists:ocr_jobs,id']);

        $job = OcrJob::where('id', $request->job_id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $job->update(['status' => 'review_requested']);

        return response()->json([
            'message' => 'Manual review requested. Admin will verify your document.',
            'job'     => $job,
        ]);
    }

    public function approve(Request $request, OcrJob $job): JsonResponse
    {
        $request->validate(['extracted_data' => 'required|array']);

        $job->update([
            'status'         => 'completed',
            'extracted_data' => $request->extracted_data,
            'data_applied'   => true,
            'reviewed_by'    => $request->user()->id,
            'reviewed_at'    => now(),
            'reviewer_notes' => $request->notes,
        ]);

        $profile = $job->studentProfile;
        $data    = $request->extracted_data;

        match ($job->document_type) {
            'passport' => $profile->update([
                'passport_number' => $data['passport_number'] ?? $profile->passport_number,
                'full_name'       => $data['full_name']       ?? $profile->full_name,
                'date_of_birth'   => $data['date_of_birth']   ?? $profile->date_of_birth,
                'nationality'     => $data['nationality']      ?? $profile->nationality,
                'passport_expiry' => $data['expiry_date']     ?? $profile->passport_expiry,
                'is_ocr_verified' => true,
                'ocr_status'      => 'verified',
            ]),
            'nid_student' => $profile->update([
                'nid_number'      => $data['nid_number']      ?? $profile->nid_number,
                'is_ocr_verified' => true,
            ]),
            default => null,
        };

        return response()->json(['message' => 'OCR job approved and data applied.', 'job' => $job]);
    }

    public function reject(Request $request, OcrJob $job): JsonResponse
    {
        $request->validate(['reason' => 'required|string']);

        $job->update([
            'status'         => 'failed',
            'failure_reason' => $request->reason,
            'reviewed_by'    => $request->user()->id,
            'reviewed_at'    => now(),
        ]);

        return response()->json(['message' => 'OCR job rejected.', 'job' => $job]);
    }
}
