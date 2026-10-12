<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CvAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// "My CV" for a signed-in student account. The section is free to look at
// for everyone; the builder is opened by staff (see Talent Passports → "Activate
// CV"), which is what `enabled` reports. Nothing here ever returns admin_notes
// or chat_log.
class StudentCvController extends Controller
{
    // GET /api/student/cv
    public function show(Request $request): JsonResponse
    {
        $access = CvAccess::with('application:id,application_code,progress,status,form_template_id,form_data')
            ->where('user_id', $request->user()->id)
            ->first();

        return response()->json($this->payload($access));
    }

    // POST /api/student/cv/submit  { consent: true }
    // "I finished my CV — please review it." This does NOT put the CV in All
    // Applications; staff do that after checking it.
    public function submit(Request $request): JsonResponse
    {
        $request->validate(['consent' => 'required|accepted']);

        $access = CvAccess::with('application')->where('user_id', $request->user()->id)->first();

        if (! $access || ! $access->isActive()) {
            return response()->json(['message' => 'My CV is not open for your account yet.'], 403);
        }
        if ($access->sent_at) {
            return response()->json(['message' => 'Your CV has already been sent to our team.'], 422);
        }

        $missing = $access->missingRequired();
        if ($missing) {
            return response()->json([
                'message' => 'Please fill in the required details first: ' . implode(', ', $missing),
                'missing' => $missing,
            ], 422);
        }

        $access->submitForReview();

        return response()->json($this->payload($access->fresh('application')));
    }

    private function payload(?CvAccess $access): array
    {
        $enabled = $access !== null && $access->isActive();

        return [
            'enabled'     => $enabled,
            'paused'      => $access !== null && ! $enabled,
            'stage'       => $enabled ? $access->stage() : null,
            'application' => $enabled && $access->application ? [
                'id'               => $access->application->id,
                'application_code' => $access->application->application_code,
                'progress'         => (int) $access->application->progress,
                'status'           => $access->application->status,
            ] : null,
            'missing'     => $enabled && ! $access->cv_submitted_at ? $access->missingRequired() : [],
            'assistant'   => $enabled ? [
                'used'      => $access->ai_messages_used,
                'limit'     => $access->ai_messages_limit,
                'remaining' => max(0, $access->ai_messages_limit - $access->ai_messages_used),
            ] : null,
        ];
    }
}
