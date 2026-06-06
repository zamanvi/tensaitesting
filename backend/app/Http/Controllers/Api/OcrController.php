<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OcrJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OcrController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'document_type' => 'required|in:passport,nid_student,ssc_certificate,ssc_marksheet,hsc_certificate,hsc_marksheet,degree_certificate,transcript,birth_certificate_student,father_birth_certificate,father_nid,mother_birth_certificate,mother_nid,student_photo,sponsor_photo,jlpt_certificate,jlpt_marksheet,nat_certificate,nat_marksheet,ielts_certificate',
        ]);

        $user = $request->user();
        $profile = $user->studentProfile;

        if (!$profile) {
            return response()->json(['message' => 'Student profile not found.'], 404);
        }

        $disk = env('R2_ACCESS_KEY_ID') ? 'r2' : 'local';
        $path = $request->file('file')->store("ocr/{$user->id}/{$request->document_type}", $disk);

        $job = OcrJob::create([
            'user_id' => $user->id,
            'student_profile_id' => $profile->id,
            'document_type' => $request->document_type,
            'original_file' => $path,
            'status' => 'queued',
        ]);

        return response()->json([
            'message' => 'Document uploaded. OCR processing queued.',
            'job_id' => $job->id,
            'status' => $job->status,
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
            'job' => $job,
        ]);
    }

    public function approve(Request $request, OcrJob $job): JsonResponse
    {
        $request->validate(['extracted_data' => 'required|array']);

        $job->update([
            'status' => 'completed',
            'extracted_data' => $request->extracted_data,
            'data_applied' => true,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'reviewer_notes' => $request->notes,
        ]);

        $profile = $job->studentProfile;
        $data = $request->extracted_data;

        match ($job->document_type) {
            'passport' => $profile->update([
                'passport_number' => $data['passport_number'] ?? $profile->passport_number,
                'full_name' => $data['full_name'] ?? $profile->full_name,
                'date_of_birth' => $data['date_of_birth'] ?? $profile->date_of_birth,
                'nationality' => $data['nationality'] ?? $profile->nationality,
                'passport_expiry' => $data['expiry_date'] ?? $profile->passport_expiry,
                'is_ocr_verified' => true,
                'ocr_status' => 'verified',
            ]),
            'nid' => $profile->update([
                'nid_number' => $data['nid_number'] ?? $profile->nid_number,
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
            'status' => 'failed',
            'failure_reason' => $request->reason,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json(['message' => 'OCR job rejected.', 'job' => $job]);
    }
}
