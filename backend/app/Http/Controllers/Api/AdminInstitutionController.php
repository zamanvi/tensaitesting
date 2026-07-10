<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\InstitutionSelection;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminInstitutionController extends Controller
{
    public function index(): JsonResponse
    {
        $institutions = User::role('institution')
            ->with('institutionProfile')
            ->latest()
            ->get()
            ->map(fn ($u) => $this->format($u));

        return response()->json($institutions);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $request->validate(['status' => 'required|in:active,suspended,pending']);
        $user->update(['status' => $request->status]);
        return response()->json($this->format($user->fresh('institutionProfile')));
    }

    public function verify(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $request->validate(['verified' => 'required|boolean']);
        $user->institutionProfile?->update(['verified' => $request->verified]);
        return response()->json($this->format($user->fresh('institutionProfile')));
    }

    public function selectedApplications(Request $request): JsonResponse
    {
        $selections = InstitutionSelection::with([
                'lead.formTemplate:id,name,country',
                'lead.user:id,name,email',
                'lead.user.studentProfile:id,user_id,highest_qualification,gpa',
                'institution:id,name,email',
                'institution.institutionProfile:id,user_id,country',
            ])
            ->latest('selected_at')
            ->get();

        $data = $selections->map(function (InstitutionSelection $sel) {
            $app  = $sel->lead;
            $sp   = $app?->user?->studentProfile;
            $inst = $sel->institution;
            return [
                'id'                  => $sel->id,
                'lead_code'           => $app?->application_code,
                'student_name'        => $app?->user?->name,
                'target_country'      => $app?->formTemplate?->country,
                'target_city'         => $app?->target_city ?? null,
                'target_course'       => $app?->target_course ?? null,
                'target_intake'       => $app?->target_intake ? $app->target_intake->toDateString() : null,
                'last_education'      => $sp?->highest_qualification,
                'gpa'                 => $sp?->gpa,
                'selected_at'         => $sel->selected_at,
                'accepted_at'         => $sel->accepted_at,
                'rejected_at'         => $sel->rejected_at,
                'processing_at'       => $sel->processing_at,
                'completed_at'        => $sel->completed_at,
                'status'              => $sel->status,
                'connect_name'        => $sel->connect_name,
                'connect_email'       => $sel->connect_email,
                'connect_whatsapp'    => $sel->connect_whatsapp,
                'connect_phone'       => $sel->connect_phone,
                'institution'         => [
                    'id'      => $inst?->id,
                    'name'    => $inst?->name,
                    'email'   => $inst?->email,
                    'country' => $inst?->institutionProfile?->country,
                ],
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function unselectApplication(Request $request, int $id): JsonResponse
    {
        $sel = InstitutionSelection::findOrFail($id);
        $sel->update(['status' => 'cancelled', 'rejected_at' => now()]);
        $sel->lead?->update(['status' => 'pool']);
        return response()->json(['message' => 'Application unselected and returned to pool.']);
    }

    public function startProcessing(Request $request, int $id): JsonResponse
    {
        $sel = InstitutionSelection::findOrFail($id);
        $sel->update(['status' => 'processing', 'processing_at' => now()]);
        $sel->lead?->update(['status' => 'processing']);
        return response()->json(['message' => 'Processing started.']);
    }

    public function markComplete(Request $request, int $id): JsonResponse
    {
        $sel = InstitutionSelection::findOrFail($id);
        $sel->update(['status' => 'complete', 'completed_at' => now()]);
        $sel->lead?->update(['status' => 'complete']);
        return response()->json(['message' => 'Marked as complete.']);
    }

    public function markIncomplete(Request $request, int $id): JsonResponse
    {
        $sel = InstitutionSelection::findOrFail($id);
        $sel->update(['status' => 'incomplete', 'rejected_at' => now()]);
        $sel->lead?->update(['status' => 'pool']);
        return response()->json(['message' => 'Marked as incomplete.']);
    }

    public function adminReject(Request $request, int $id): JsonResponse
    {
        $sel = InstitutionSelection::findOrFail($id);
        $sel->update(['status' => 'rejected', 'rejected_at' => now()]);
        $sel->lead?->update(['status' => 'pool']);
        return response()->json(['message' => 'Selection rejected.']);
    }

    public function adminRevive(Request $request, int $id): JsonResponse
    {
        $sel = InstitutionSelection::findOrFail($id);
        $sel->update(['status' => 'selected', 'rejected_at' => null]);
        $sel->lead?->update(['status' => 'pool']);
        return response()->json(['message' => 'Application revived.']);
    }

    private function format(User $u): array
    {
        return [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'status'     => $u->status,
            'profile'    => $u->institutionProfile,
            'created_at' => $u->created_at->toISOString(),
        ];
    }
}
