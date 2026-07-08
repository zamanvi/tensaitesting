<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ContactPaper;
use App\Models\InstitutionProfile;
use App\Models\InstitutionSelection;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InstitutionController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        $profile = $request->user()->institutionProfile;
        return response()->json(['profile' => $profile]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        // required_language_scores may arrive as a JSON string via FormData
        if ($request->has('required_language_scores') && is_string($request->input('required_language_scores'))) {
            $decoded = json_decode($request->input('required_language_scores'), true);
            $request->merge(['required_language_scores' => is_array($decoded) ? $decoded : null]);
        }

        $validated = $request->validate([
            'institution_name'          => 'required|string|max:255',
            'institution_name_local'    => 'nullable|string|max:255',
            'institution_type'          => 'nullable|in:university,college,language_school,vocational,employer',
            'country'                   => 'required|string|max:100',
            'city'                      => 'required|string|max:100',
            'address'                   => 'required|string',
            'website'                   => 'nullable|url',
            'description'               => 'nullable|string|max:1000',
            'intake_months'             => 'nullable|array',
            'accepted_qualifications'   => 'nullable|array',
            'required_language_scores'  => 'nullable|array',
            'tuition_fee_min'           => 'nullable|numeric|min:0',
            'tuition_fee_max'           => 'nullable|numeric|min:0',
            'currency'                  => 'nullable|string|max:10',
            'logo'                      => 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $user    = $request->user();
        $profile = $user->institutionProfile;
        $disk    = app()->environment('production') ? 'r2' : 'public';

        if ($request->hasFile('logo')) {
            if ($profile?->logo) Storage::disk($disk)->delete($profile->logo);
            $file = $request->file('logo');
            $path = 'institution/logos/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($disk)->put($path, file_get_contents($file->getRealPath()));
            $validated['logo'] = $path;
        }

        if ($profile) {
            // Only allow editing if not yet active (approved)
            if ($profile->status === 'active') {
                return response()->json(['message' => 'Profile is locked after approval. Contact support to update.'], 403);
            }
            $validated['status'] = 'pending';
            $profile->update($validated);
        } else {
            $validated['user_id'] = $user->id;
            $validated['status']  = 'pending';
            $profile = InstitutionProfile::create($validated);
        }

        return response()->json([
            'message' => 'Institution profile saved. Awaiting admin review.',
            'profile' => $profile->fresh(),
        ]);
    }

    public function myLeads(Request $request): JsonResponse
    {
        $leads = Lead::where('assigned_institution_id', $request->user()->id)
            ->with([
                'student:id,name,email',
                'student.studentProfile:id,user_id,jlpt_level,nat_level,gpa,highest_qualification,is_ocr_verified',
                'sourceAgency:id,name',
            ])
            ->orderByDesc('created_at')
            ->paginate(20);

        // Flatten student profile fields and compute eligibility score
        $leads->getCollection()->transform(function (Lead $lead) {
            $profile = $lead->student?->studentProfile;
            $data = $lead->toArray();
            $data['agency_name'] = $lead->sourceAgency?->name;
            if ($lead->student) {
                $data['student'] = [
                    'name'                  => $lead->student->name,
                    'email'                 => $lead->student->email,
                    'jlpt_level'            => $profile?->jlpt_level,
                    'nat_level'             => $profile?->nat_level,
                    'gpa'                   => $profile?->gpa,
                    'highest_qualification' => $profile?->highest_qualification,
                    'eligibility_score'     => $profile?->eligibilityScore(),
                ];
            }
            unset($data['source_agency'], $data['student']['student_profile']);
            return $data;
        });

        return response()->json($leads);
    }

    /**
     * Anonymous pool of submitted applications matching institution's country.
     * Student personal info (name, email, phone, address) is stripped.
     */
    public function browseApplications(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = $user->institutionProfile;
        $country = $profile?->country;

        $selectedIds = InstitutionSelection::where('institution_id', $user->id)
            ->pluck('lead_id')
            ->toArray();

        $q = Application::with([
                'formTemplate:id,name,country,visa_type,intake_options',
                'user.studentProfile:id,user_id,highest_qualification,gpa,jlpt_level,nat_level',
            ])
            ->where('status', 'submitted')
            ->latest('submitted_at');

        if ($country) {
            $q->whereHas('formTemplate', fn ($t) => $t->where('country', $country));
        }

        // Filters
        if ($request->education) {
            $q->whereHas('user.studentProfile', fn ($p) => $p->where('highest_qualification', $request->education));
        }
        if ($request->jlpt) {
            $q->whereHas('user.studentProfile', fn ($p) => $p->where('jlpt_level', $request->jlpt));
        }

        $paginated = $q->paginate(30);

        $paginated->getCollection()->transform(function (Application $app) use ($selectedIds) {
            $sp = $app->user?->studentProfile;
            return [
                'id'                  => $app->id,
                'application_code'    => $app->application_code,
                'country'             => $app->formTemplate?->country,
                'form_name'           => $app->formTemplate?->name,
                'intake'              => $app->formTemplate?->intake_options,
                'progress'            => $app->progress,
                'status'              => $app->status,
                'submitted_at'        => $app->submitted_at,
                'highest_qualification' => $sp?->highest_qualification,
                'gpa'                 => $sp?->gpa,
                'jlpt_level'          => $sp?->jlpt_level,
                'nat_level'           => $sp?->nat_level,
                'already_selected'    => in_array($app->id, $selectedIds),
            ];
        });

        return response()->json([
            'data'               => $paginated->items(),
            'total'              => $paginated->total(),
            'institution_country'=> $country,
        ]);
    }

    /**
     * Institution selects an application — creates InstitutionSelection record.
     */
    public function selectApplication(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $app  = Application::where('id', $id)->where('status', 'submitted')->firstOrFail();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255',
            'whatsapp' => 'nullable|string|max:50',
            'phone'    => 'nullable|string|max:50',
        ]);

        $existing = InstitutionSelection::where('lead_id', $app->id)
            ->where('institution_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already selected this application.'], 409);
        }

        InstitutionSelection::create([
            'lead_id'         => $app->id,
            'institution_id'  => $user->id,
            'connect_name'    => $validated['name'],
            'connect_email'   => $validated['email'],
            'connect_whatsapp'=> $validated['whatsapp'] ?? null,
            'connect_phone'   => $validated['phone'] ?? null,
            'status'          => 'selected',
            'selected_at'     => now(),
        ]);

        $app->update(['status' => 'selected']);

        return response()->json(['message' => 'Application selected successfully.'], 201);
    }

    /**
     * List applications selected by this institution.
     */
    public function selectedApplications(Request $request): JsonResponse
    {
        $user = $request->user();

        $selections = InstitutionSelection::where('institution_id', $user->id)
            ->with([
                'lead.formTemplate:id,name,country',
                'lead.user.studentProfile:id,user_id,highest_qualification,gpa,jlpt_level,nat_level',
            ])
            ->latest('selected_at')
            ->get();

        $data = $selections->map(function (InstitutionSelection $sel) {
            $app = $sel->lead;
            $sp  = $app?->user?->studentProfile;
            return [
                'id'               => $sel->id,
                'application_id'   => $app?->id,
                'lead_code'        => $app?->application_code,
                'country'          => $app?->formTemplate?->country,
                'form_name'        => $app?->formTemplate?->name,
                'highest_qualification' => $sp?->highest_qualification,
                'gpa'              => $sp?->gpa,
                'jlpt_level'       => $sp?->jlpt_level,
                'selected_at'      => $sel->selected_at,
                'status'           => $sel->status,
                'connect_name'     => $sel->connect_name,
                'connect_email'    => $sel->connect_email,
                'connect_whatsapp' => $sel->connect_whatsapp,
                'connect_phone'    => $sel->connect_phone,
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Institution sends a contact request for a published lead.
     * Creates a ContactPaper (type = institution_contact_request) visible to admin.
     */
    public function contactRequest(Request $request, Lead $lead): JsonResponse
    {
        $validated = $request->validate([
            'message'         => 'required|string|max:1000',
            'proposed_course' => 'nullable|string|max:255',
            'proposed_intake' => 'nullable|string|max:100',
        ]);

        $institution = $request->user();

        // Prevent duplicate contact requests from the same institution for the same lead
        $exists = ContactPaper::where('lead_id', $lead->id)
            ->where('from_user_id', $institution->id)
            ->where('type', 'institution_contact_request')
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'You have already sent a contact request for this student.'], 409);
        }

        // Find admin to notify (first super_admin, fallback to platform_admin_id config)
        $adminId = User::role('super_admin')->value('id')
            ?? User::role('admin')->value('id')
            ?? (int) config('app.platform_admin_id', 1);

        $courseInfo = $validated['proposed_course']
            ? " | Proposed course: {$validated['proposed_course']}"
            : '';
        $intakeInfo = $validated['proposed_intake']
            ? " | Intake: {$validated['proposed_intake']}"
            : '';

        $paper = ContactPaper::create([
            'reference_number' => 'CP-' . date('Y') . '-' . strtoupper(Str::random(6)),
            'lead_id'          => $lead->id,
            'type'             => 'institution_contact_request',
            'from_user_id'     => $institution->id,
            'to_user_id'       => $adminId,
            'subject'          => "Contact Request from {$institution->name} for Lead {$lead->lead_code}",
            'body'             => $validated['message'] . $courseInfo . $intakeInfo,
        ]);

        return response()->json([
            'message' => 'Contact request sent. Our team will follow up shortly.',
            'reference' => $paper->reference_number,
        ], 201);
    }
}
