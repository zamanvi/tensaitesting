<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CvAccess;
use App\Support\CvInterview;
use App\Support\CvPreview;
use App\Support\CvSummarizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// "My CV" for a signed-in student account. The section is free to look at
// for everyone; the assistant is opened by staff (see Talent Passports →
// "Activate CV"), which is what `enabled` reports. Nothing here ever returns
// admin_notes or the raw chat_log.
class StudentCvController extends Controller
{
    // GET /api/student/cv
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->payload($this->accessFor($request)));
    }

    // POST /api/student/cv/answer  { field_key, value?  }   (empty value = skip an optional one)
    public function answer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'field_key' => 'required|string|max:100',
            'value'     => 'nullable|string|max:2000',
        ]);

        $access = $this->accessFor($request);
        if (! $access || ! $access->isActive()) {
            return response()->json(['message' => 'My CV is not open for your account yet.'], 403);
        }

        CvInterview::answer($access, $data['field_key'], $data['value'] ?? null);

        return response()->json($this->payload($this->accessFor($request)));
    }

    // POST /api/student/cv/polish — write the English profile summary.
    public function polish(Request $request): JsonResponse
    {
        $access = $this->accessFor($request);
        if (! $access || ! $access->isActive()) {
            return response()->json(['message' => 'My CV is not open for your account yet.'], 403);
        }
        if (! CvSummarizer::configured()) {
            return response()->json(['message' => 'The summary helper is not switched on yet.'], 503);
        }

        $facts = CvSummarizer::facts($access->application?->form_data ?? []);
        if (empty($facts['desired_job']) || empty($facts['experience'])) {
            return response()->json(['message' => 'Please answer the job title and experience questions first.'], 422);
        }

        // One message is reserved atomically, so two quick taps cannot go
        // over the limit; it is handed back if Google fails.
        $reserved = CvAccess::whereKey($access->id)
            ->whereColumn('ai_messages_used', '<', 'ai_messages_limit')
            ->increment('ai_messages_used');
        if (! $reserved) {
            return response()->json(['message' => 'You have used all your assistant messages. Please contact our team.'], 429);
        }

        $summary = CvSummarizer::summarize($facts, $request->user()->id);
        if ($summary === null) {
            CvAccess::whereKey($access->id)->where('ai_messages_used', '>', 0)->decrement('ai_messages_used');

            return response()->json(['message' => 'The summary could not be written right now. Please try again later.'], 503);
        }

        $access->refresh();
        $log                = $access->chat_log ?? [];
        $log['ai_summary']  = $summary;
        $access->chat_log   = $log;
        $access->save();

        return response()->json($this->payload($this->accessFor($request)));
    }

    // POST /api/student/cv/submit  { consent: true }
    // "I finished my CV — please review it." This does NOT put the CV in All
    // Applications; staff do that after checking it.
    public function submit(Request $request): JsonResponse
    {
        $request->validate(['consent' => 'required|accepted']);

        $access = $this->accessFor($request);

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

        return response()->json($this->payload($this->accessFor($request)));
    }

    private function accessFor(Request $request): ?CvAccess
    {
        return CvAccess::with(['application', 'candidate'])
            ->where('user_id', $request->user()->id)
            ->first();
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
            'interview'   => $enabled ? CvInterview::state($access) : null,
            'preview'     => $enabled ? CvPreview::build($access) : null,
            'assistant'   => $enabled ? [
                'used'      => $access->ai_messages_used,
                'limit'     => $access->ai_messages_limit,
                'remaining' => max(0, $access->ai_messages_limit - $access->ai_messages_used),
                'summary_available' => CvSummarizer::configured(),
            ] : null,
        ];
    }
}
