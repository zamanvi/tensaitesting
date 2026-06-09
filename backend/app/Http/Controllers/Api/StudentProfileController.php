<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileController extends Controller
{
    // Student: view own profile
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->studentProfile;
        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }
        return response()->json([
            'profile' => $profile,
            'eligibility_score' => $profile->eligibilityScore(),
            'ocr_jobs' => $profile->ocrJobs()->latest()->get(),
        ]);
    }

    // Student: update own profile (only unlocked fields)
    public function update(Request $request): JsonResponse
    {
        $profile = $request->user()->studentProfile;
        if (!$profile) {
            return response()->json(['message' => 'Profile not found.'], 404);
        }
        if ($profile->is_data_locked) {
            return response()->json(['message' => 'Profile is locked. Contact admin to make changes.'], 403);
        }

        $validated = $request->validate([
            'applicant_name' => 'nullable|string|max:150',
            'full_name' => 'nullable|string|max:255',
            'full_name_japanese' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'nationality' => 'nullable|string',
            'religion' => 'nullable|string',
            'address_bangladesh' => 'nullable|string',
            'street_address' => 'nullable|string|max:500',
            'district' => 'nullable|string|max:100',
            'division' => 'nullable|in:Dhaka,Chittagong,Sylhet,Rajshahi,Khulna,Barishal,Rangpur,Mymensingh',
            'postal_code' => 'nullable|string|max:20',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:30',
            'emergency_contact_relation' => 'nullable|string|max:100',
            'highest_qualification' => 'nullable|string',
            'gpa' => 'nullable|numeric|min:0|max:5',
            'institution_name' => 'nullable|string',
            'passing_year' => 'nullable|integer|min:1990|max:2030',
            'jlpt_level' => 'nullable|in:N1,N2,N3,N4,N5',
            'nat_level' => 'nullable|in:1,2,3,4,5',
            'ielts_score' => 'nullable|numeric|min:0|max:9',
            'blood_group' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'mobile_number' => 'nullable|string|max:20',
            'whatsapp_number' => 'nullable|string|max:20',
            'family_info' => 'nullable|array',
            'permanent_address' => 'nullable|array',
            'present_address' => 'nullable|array',
            'education_history' => 'nullable|array',
            'sponsor_info' => 'nullable|array',
        ]);

        $profile->update($validated);

        return response()->json(['profile' => $profile, 'eligibility_score' => $profile->eligibilityScore()]);
    }

    // Agency: view student profile (contact info masked)
    public function agencyView(Request $request, User $student): JsonResponse
    {
        if (!$student->isStudent()) {
            return response()->json(['message' => 'User is not a student.'], 422);
        }

        // Ensure the requesting agency actually has a lead for this student
        $agencyId = $request->user()->id;
        $hasLead = Lead::where('student_id', $student->id)
            ->where(function ($q) use ($agencyId) {
                $q->where('source_agency_id', $agencyId)
                  ->orWhere('assigned_agency_id', $agencyId);
            })
            ->exists();

        if (!$hasLead) {
            return response()->json(['message' => 'Unauthorized. No lead relationship with this student.'], 403);
        }

        $profile = $student->studentProfile;
        if (!$profile || !$profile->is_admin_verified) {
            return response()->json(['message' => 'Student profile not verified yet.'], 403);
        }

        // Return profile but strip contact info unless student allowed it
        $data = $profile->toArray();
        unset($data['nid_number']); // never expose NID to agency

        return response()->json([
            'student' => ['id' => $student->id, 'name' => $student->name],
            'profile' => $data,
            'eligibility_score' => $profile->eligibilityScore(),
        ]);
    }

    // Institution: browse agency-published leads (contact masked)
    public function institutionBrowse(Request $request): JsonResponse
    {
        // Only show leads that agencies have published (is_published=true)
        // These are students that agencies explicitly want institutions to see
        $query = Lead::where('is_published', true)
            ->whereNotNull('source_agency_id')
            ->with([
                'student:id,name',
                'student.studentProfile',
                'sourceAgency:id,name',
            ]);

        // Filters on the student profile
        if ($request->jlpt_level) {
            $query->whereHas('student.studentProfile', fn ($q) => $q->where('jlpt_level', $request->jlpt_level));
        }
        if ($request->nat_level) {
            $query->whereHas('student.studentProfile', fn ($q) => $q->where('nat_level', $request->nat_level));
        }
        if ($request->min_gpa) {
            $query->whereHas('student.studentProfile', fn ($q) => $q->where('gpa', '>=', $request->min_gpa));
        }
        if ($request->gender) {
            $query->whereHas('student.studentProfile', fn ($q) => $q->where('gender', $request->gender));
        }

        $leads = $query->orderByDesc('published_at')->paginate(20);

        // Return lead + masked student profile (no contact info)
        $leads->getCollection()->transform(function (Lead $lead) {
            $profile = $lead->student?->studentProfile;
            return [
                'lead_id'              => $lead->id,
                'lead_code'            => $lead->lead_code,
                'target_country'       => $lead->target_country,
                'target_course'        => $lead->target_course,
                'target_intake'        => $lead->target_intake?->format('Y-m-d'),
                'published_at'         => $lead->published_at?->toDateString(),
                'source_agency'        => $lead->sourceAgency?->name,
                'student_id'           => $lead->student_id,
                'student_name'         => $lead->student?->name,
                'gender'               => $profile?->gender,
                'nationality'          => $profile?->nationality,
                'highest_qualification'=> $profile?->highest_qualification,
                'gpa'                  => $profile?->gpa,
                'passing_year'         => $profile?->passing_year,
                'jlpt_level'           => $profile?->jlpt_level,
                'nat_level'            => $profile?->nat_level,
                'ielts_score'          => $profile?->ielts_score,
                'eligibility_score'    => $profile?->eligibilityScore() ?? 0,
                // phone/email/passport/nid intentionally omitted
            ];
        });

        return response()->json($leads);
    }

    // Institution: shortlist a student (creates a lead)
    public function shortlist(Request $request, User $student): JsonResponse
    {
        $request->validate([
            'target_course' => 'nullable|string',
            'target_intake' => 'nullable|date',
        ]);

        if (!$student->isStudent()) {
            return response()->json(['message' => 'User is not a student.'], 422);
        }

        // Check if lead already exists for this student+institution pair
        $existing = Lead::where('student_id', $student->id)
            ->where('assigned_institution_id', $request->user()->id)
            ->whereNotIn('status', ['closed', 'visa_rejected'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Student already shortlisted.', 'lead' => $existing], 409);
        }

        $lead = Lead::create([
            'student_id' => $student->id,
            'assigned_institution_id' => $request->user()->id,
            'pool_type' => 'open',
            'status' => 'shortlisted',
            'target_country' => $request->user()->institutionProfile?->country ?? 'Japan',
            'target_course' => $request->target_course,
            'target_intake' => $request->target_intake,
        ]);

        return response()->json(['message' => 'Student shortlisted.', 'lead' => $lead], 201);
    }
}
