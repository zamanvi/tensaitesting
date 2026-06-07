<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactPaper;
use App\Models\Interview;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    public function myInterviews(Request $request): JsonResponse
    {
        $interviews = Interview::where('student_id', $request->user()->id)
            ->with(['lead:id,lead_code,status', 'institution:id,name'])
            ->orderBy('scheduled_at', 'desc')
            ->get();

        return response()->json($interviews);
    }

    public function institutionInterviews(Request $request): JsonResponse
    {
        $interviews = Interview::where('institution_id', $request->user()->id)
            ->with(['lead:id,lead_code,status', 'student:id,name,email'])
            ->orderBy('scheduled_at', 'desc')
            ->get();

        return response()->json($interviews);
    }

    // Institution requests interview for a lead
    public function institutionRequest(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'preferred_date' => 'required|date|after:today',
            'medium' => 'required|in:zoom,google_meet,teams,phone,in_person',
            'notes' => 'nullable|string',
        ]);

        $adminId = User::role('super_admin')->value('id') ?? 1;

        // Create contact paper (formal record — institution → Tensai)
        ContactPaper::create([
            'reference_number' => 'CP-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5)),
            'lead_id' => $lead->id,
            'type' => 'interview_request',
            'from_user_id' => $request->user()->id,
            'to_user_id' => $adminId,
            'subject' => "Interview Request for Lead #{$lead->lead_code}",
            'body' => "Institution requests interview.\nPreferred date: {$request->preferred_date}\nMedium: {$request->medium}\nNotes: {$request->notes}",
        ]);

        $lead->update(['status' => 'shortlisted']);

        return response()->json([
            'message' => 'Interview request submitted. Tensai will arrange and confirm the schedule.',
        ]);
    }

    // Agency requests interview on behalf of student
    public function request(Request $request, Lead $lead): JsonResponse
    {
        $request->validate([
            'institution_id' => 'required|exists:users,id',
            'preferred_date' => 'required|date|after:today',
            'medium' => 'required|in:zoom,google_meet,teams,phone,in_person',
        ]);

        $adminId = User::role('super_admin')->value('id') ?? 1;

        ContactPaper::create([
            'reference_number' => 'CP-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5)),
            'lead_id' => $lead->id,
            'type' => 'interview_request',
            'from_user_id' => $request->user()->id,
            'to_user_id' => $adminId,
            'subject' => "Interview Request: Lead #{$lead->lead_code}",
            'body' => "Agency requests interview with institution #{$request->institution_id}.\nPreferred: {$request->preferred_date}\nMedium: {$request->medium}",
        ]);

        return response()->json(['message' => 'Interview request sent to Tensai admin.']);
    }

    // Admin arranges interview (sets time, sends confirmation)
    public function arrange(Request $request, Interview $interview): JsonResponse
    {
        $request->validate([
            'scheduled_at' => 'required|date|after:now',
            'medium' => 'required|in:zoom,google_meet,teams,phone,in_person',
            'meeting_link' => 'nullable|url',
            'duration_minutes' => 'integer|min:15|max:120',
        ]);

        $interview->update([
            'scheduled_at' => $request->scheduled_at,
            'medium' => $request->medium,
            'meeting_link' => $request->meeting_link,
            'duration_minutes' => $request->duration_minutes ?? 30,
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'arranged_by' => $request->user()->id,
        ]);

        $interview->lead->update(['status' => 'interview_scheduled']);

        // Create confirmation contact paper
        ContactPaper::create([
            'reference_number' => 'CP-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5)),
            'lead_id' => $interview->lead_id,
            'interview_id' => $interview->id,
            'type' => 'interview_confirmation',
            'from_user_id' => $request->user()->id,
            'to_user_id' => $interview->student_id,
            'subject' => "Interview Confirmed — {$interview->scheduled_at}",
            'body' => "Your interview has been scheduled.\nDate: {$interview->scheduled_at}\nMedium: {$interview->medium}\nLink: {$interview->meeting_link}",
        ]);

        return response()->json([
            'message' => 'Interview arranged. Confirmation sent to student.',
            'interview' => $interview,
        ]);
    }
}
