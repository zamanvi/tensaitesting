<?php

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\StudentProfileController;
use App\Http\Controllers\Api\AgencyController;
use App\Http\Controllers\Api\AgencyProfileController;
use App\Http\Controllers\Api\InstitutionController;
use App\Http\Controllers\Api\OcrController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\AffiliateProfileController;
use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\AdminGalleryController;
use App\Models\Setting;
use App\Http\Controllers\Api\HelpRequestController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\BranchAdminController;
use App\Http\Controllers\Api\ApplicationFormController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\FormTemplateController;
use App\Http\Controllers\Api\AdminSettingsController;
use App\Http\Controllers\Api\AdminAffiliateController;
use App\Http\Controllers\Api\AdminInstitutionController;
use App\Http\Controllers\Api\AccountController;
use Illuminate\Support\Facades\Route;

// Form Templates (authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/form-templates',      [FormTemplateController::class, 'index']);
    Route::get('/form-templates/{id}', [FormTemplateController::class, 'show'])->where('id', '[0-9]+');
});

// Health check
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json(['status' => 'ok', 'db' => 'connected', 'app' => 'Tensai API']);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'db' => 'disconnected'], 500);
    }
});

// Public settings
Route::get('/settings/public', function () {
    $keys = [
        'facebook_url', 'youtube_url', 'instagram_url', 'tiktok_url',
        'linkedin_url', 'twitter_url',
        'support_whatsapp', 'support_phone', 'support_email', 'office_address',
        'copyright_en', 'copyright_ja', 'copyright_bn',
        'target_countries', 'referral_fees',
    ];
    $settings = \App\Models\Setting::whereIn('key', $keys)->pluck('value', 'key')->toArray();
    foreach (['target_countries', 'referral_fees'] as $jsonKey) {
        if (isset($settings[$jsonKey]) && is_string($settings[$jsonKey])) {
            $settings[$jsonKey] = json_decode($settings[$jsonKey], true);
        }
    }
    return response()->json($settings);
});

// Branches (public)
Route::get('/branches', [BranchController::class, 'index']);
Route::get('/branches/file', [BranchController::class, 'serveFile']);
Route::get('/branches/{slug}', [BranchController::class, 'show']);

Route::get('/gallery', [GalleryController::class, 'index']);
Route::get('/gallery/featured', [GalleryController::class, 'featured']);
Route::get('/gallery/image/{gallery}', [GalleryController::class, 'serveImage']);

// Public auth
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/register',             [AuthController::class, 'register']);
    Route::post('/auth/login',                [AuthController::class, 'login']);
    Route::post('/auth/verify-email',         [AuthController::class, 'verifyEmail']);
    Route::post('/auth/resend-verification',  [AuthController::class, 'resendVerification']);
    Route::post('/auth/forgot-password',      [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password',       [AuthController::class, 'resetPassword']);
});

// Authenticated
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    // ── New Application system (all authenticated roles) ──────────────────────
    Route::get('/applications',                                  [ApplicationController::class, 'index']);
    Route::post('/applications',                                 [ApplicationController::class, 'store']);
    Route::get('/applications/{id}',                            [ApplicationController::class, 'show']);
    Route::patch('/applications/{id}',                          [ApplicationController::class, 'update']);
    Route::post('/applications/{id}/submit',                    [ApplicationController::class, 'submit']);
    Route::post('/applications/{id}/live-to-school',           [ApplicationController::class, 'liveToSchool']);
    Route::post('/applications/{id}/documents',                 [ApplicationController::class, 'uploadDocument']);
    Route::delete('/applications/{id}/documents/{docId}',       [ApplicationController::class, 'deleteDocument']);
    Route::delete('/applications/{id}',                          [ApplicationController::class, 'destroy']);

    // Student gateway
    Route::prefix('student')->middleware('role:student')->group(function () {
        Route::get('/profile', [StudentProfileController::class, 'show']);
        Route::put('/profile', [StudentProfileController::class, 'update']);
        Route::patch('/account',        [AccountController::class, 'update']);
        Route::post('/account/avatar',  [AccountController::class, 'avatar']);
        Route::get('/referrals',        [AffiliateController::class, 'referredStudents']);
        Route::post('/ocr/upload', [OcrController::class, 'upload']);
        Route::post('/ocr/review-request', [OcrController::class, 'requestReview']);
        Route::post('/help-request', [HelpRequestController::class, 'store']);
        Route::get('/help-requests', [HelpRequestController::class, 'myRequests']);
        Route::get('/leads',        [LeadController::class, 'myLeads']);
        Route::get('/leads/{id}',   [LeadController::class, 'studentShow']);
        Route::patch('/leads/{id}', [LeadController::class, 'studentUpdate']);
        Route::get('/interviews', [InterviewController::class, 'myInterviews']);
    });

    // Agency gateway
    Route::prefix('agency')->middleware('agency.access')->group(function () {
        Route::get('/profile',  [AgencyProfileController::class, 'show']);
        Route::post('/profile', [AgencyProfileController::class, 'upsert']);
        Route::get('/settings',          [AccountController::class, 'agencySettings']);
        Route::patch('/settings',        [AccountController::class, 'agencySettings']);
        Route::post('/avatar',           [AccountController::class, 'avatar']);
        Route::post('/change-password',  [AccountController::class, 'changePassword']);
        Route::post('/leads', [LeadController::class, 'addLead']);
        Route::get('/leads/private-vault', [LeadController::class, 'privateVault']);
        Route::get('/leads/open-pool', [LeadController::class, 'openPool']);
        Route::post('/leads/{lead}/publish', [LeadController::class, 'publishToOpenPool']);
        Route::post('/leads/{lead}/forward', [LeadController::class, 'forwardLead']);
        Route::post('/leads/{lead}/unlock', [LeadController::class, 'unlockLead']);
        Route::get('/partners', [LeadController::class, 'agencyPartners']);
        Route::get('/students/{student}/profile', [StudentProfileController::class, 'agencyView']);
        Route::post('/interview-request/{lead}', [InterviewController::class, 'request']);
    });

    // Institution gateway
    Route::prefix('institution')->middleware('role:institution')->group(function () {
        Route::get('/profile', [InstitutionController::class, 'profile']);
        Route::post('/profile', [InstitutionController::class, 'updateProfile']);
        Route::get('/account',          [AccountController::class, 'update']);
        Route::patch('/account',        [AccountController::class, 'update']);
        Route::post('/account/avatar',  [AccountController::class, 'avatar']);
        Route::get('/account-managers', [InstitutionController::class, 'profile']);
        Route::get('/referrals',        [AffiliateController::class, 'referredStudents']);
        Route::get('/browse-applications',   [InstitutionController::class, 'browseApplications']);
        Route::post('/select-application/{id}', [InstitutionController::class, 'selectApplication']);
        Route::get('/selected-applications', [InstitutionController::class, 'selectedApplications']);
        Route::post('/accept-application/{id}',   [InstitutionController::class, 'acceptApplication']);
        Route::post('/reject-application/{id}',   [InstitutionController::class, 'rejectApplication']);
        Route::post('/unselect-application/{id}', [InstitutionController::class, 'unselectApplication']);
        Route::post('/revive-application/{id}',   [InstitutionController::class, 'reviveApplication']);
        Route::get('/leads', [InstitutionController::class, 'myLeads']);
        Route::get('/students', [StudentProfileController::class, 'institutionBrowse']);
        Route::post('/contact-request/{lead}', [InstitutionController::class, 'contactRequest']);
        Route::post('/shortlist/{student}', [StudentProfileController::class, 'shortlist']);
        Route::post('/interview-request/{lead}', [InterviewController::class, 'institutionRequest']);
        Route::get('/interviews', [InterviewController::class, 'institutionInterviews']);
    });

    // Affiliate gateway
    Route::prefix('affiliate')->middleware('role:affiliate')->group(function () {
        Route::post('/set-type',          [AffiliateController::class, 'setType']);
        Route::post('/avatar',            [AccountController::class, 'avatar']);
        Route::patch('/change-password',  [AccountController::class, 'changePassword']);
        Route::get('/settings',           [AccountController::class, 'update']);
        Route::patch('/settings',         [AccountController::class, 'update']);
        Route::get('/institution-referrals', [AffiliateController::class, 'referredStudents']);
        Route::get('/profile',         [AffiliateController::class, 'showProfile']);
        Route::post('/profile',        [AffiliateController::class, 'updateProfile']);
        Route::get('/dashboard',       [AffiliateController::class, 'dashboard']);
        Route::get('/referrals',       [AffiliateController::class, 'referredStudents']);
        Route::get('/entities',        [AffiliateController::class, 'entities']);
        Route::post('/entities',       [AffiliateController::class, 'storeEntity']);
        Route::put('/entities/{id}',   [AffiliateController::class, 'updateEntity']);
        Route::delete('/entities/{id}',[AffiliateController::class, 'deleteEntity']);
        Route::get('/commissions',     [AffiliateController::class, 'commissions']);
        Route::post('/upgrade-request',[AffiliateController::class, 'upgradeRequest']);
    });

    // Branch admin gateway
    Route::prefix('branch-admin')->middleware('role:branch_admin|branch_manager')->group(function () {
        Route::get('/interviews',  [InterviewController::class, 'branchInterviews']);
        Route::get('/my-branch',   [BranchController::class, 'myBranch']);
        Route::patch('/contact',   [BranchController::class, 'updateContact']);
        Route::get('/settings',    [BranchAdminController::class, 'getSettings']);
        Route::patch('/settings',  [BranchAdminController::class, 'updateSettings']);
        Route::get('/leads',                    [BranchAdminController::class, 'leads']);
        Route::post('/leads',                   [BranchAdminController::class, 'storeLead']);
        Route::get('/leads/{id}',               [BranchAdminController::class, 'showLead']);
        Route::patch('/leads/{id}',             [BranchAdminController::class, 'updateLead']);
        Route::post('/leads/{id}/submit',       [BranchAdminController::class, 'submitLead']);
        Route::get('/team',                    [BranchAdminController::class, 'team']);
        Route::post('/team',                   [BranchAdminController::class, 'storeTeamMember']);
        Route::patch('/team/{id}',             [BranchAdminController::class, 'updateTeamMember']);
        Route::delete('/team/{id}',            [BranchAdminController::class, 'deleteTeamMember']);
        Route::get('/gallery',                 [BranchAdminController::class, 'gallery']);
        Route::post('/gallery',                [BranchAdminController::class, 'storeGallery']);
        Route::post('/gallery/{id}',           [BranchAdminController::class, 'updateGallery']);
        Route::delete('/gallery/{id}',         [BranchAdminController::class, 'deleteGallery']);
        // Legacy application forms (keep for old data)
        Route::get('/application-forms',                              [ApplicationFormController::class, 'index']);
        Route::post('/application-forms',                             [ApplicationFormController::class, 'store']);
        Route::get('/application-forms/{id}',                        [ApplicationFormController::class, 'show']);
        Route::patch('/application-forms/{id}',                      [ApplicationFormController::class, 'update']);
        Route::post('/application-forms/{id}/submit',                [ApplicationFormController::class, 'submit']);
        Route::post('/application-forms/{id}/documents',             [ApplicationFormController::class, 'uploadDocument']);
        Route::delete('/application-forms/{id}/documents/{docId}',   [ApplicationFormController::class, 'deleteDocument']);
    });

    // Admin only
    Route::prefix('admin')->middleware('role:admin|super_admin')->group(function () {
        Route::get('/leads',                      [LeadController::class, 'adminIndex']);
        Route::get('/leads/{lead}',               [LeadController::class, 'adminShow']);
        Route::put('/leads/{lead}/assign-agency',       [LeadController::class, 'assignAgency']);
        Route::put('/leads/{lead}/status',              [LeadController::class, 'updateStatus']);
        Route::put('/leads/{lead}/accept-submission',   [LeadController::class, 'acceptSubmission']);
        Route::put('/leads/{lead}/reject-submission',   [LeadController::class, 'rejectSubmission']);
        Route::post('/ocr/{job}/approve', [OcrController::class, 'approve']);
        Route::post('/ocr/{job}/reject', [OcrController::class, 'reject']);
        Route::post('/interviews/{interview}/arrange', [InterviewController::class, 'arrange']);
        Route::get('/commissions', [CommissionController::class, 'index']);
        Route::get('/users',                      [AdminUserController::class, 'index']);
        Route::get('/agencies',                   [AgencyController::class, 'index']);
        Route::post('/agencies/{agency}/approve', [AgencyController::class, 'approve']);
        Route::post('/agencies/{agency}/reject',  [AgencyController::class, 'reject']);
        Route::get('/settings',    [AdminSettingsController::class, 'index']);
        Route::patch('/settings',  [AdminSettingsController::class, 'update']);
        Route::get('/branches',                                [BranchController::class, 'adminIndex']);
        Route::post('/branches',                               [BranchController::class, 'store']);
        Route::patch('/branches/{branch}',                     [BranchController::class, 'update']);
        Route::post('/branches/{branch}/create-admin',         [BranchController::class, 'createAdmin']);
        Route::get('/gallery',                          [AdminGalleryController::class, 'index']);
        Route::post('/gallery',                         [AdminGalleryController::class, 'store']);
        Route::post('/gallery/{gallery}',               [AdminGalleryController::class, 'update']);
        Route::post('/gallery/{gallery}/toggle',        [AdminGalleryController::class, 'toggle']);
        Route::delete('/gallery/{gallery}',             [AdminGalleryController::class, 'destroy']);
        // Admin applications (full list + status control)
        Route::get('/applications',                     [ApplicationController::class, 'index']);
        Route::patch('/applications/{id}/status',       [ApplicationController::class, 'updateStatus']);

        // Admin affiliates
        Route::get('/affiliates',                                                    [AdminAffiliateController::class, 'index']);
        Route::patch('/affiliates/{id}/status',                                      [AdminAffiliateController::class, 'updateStatus']);
        Route::patch('/affiliates/{affiliateId}/commissions/{commissionId}/mark-paid', [AdminAffiliateController::class, 'markCommissionPaid']);
        Route::patch('/affiliates/{affiliateId}/commissions/mark-all-paid',          [AdminAffiliateController::class, 'markAllPaid']);

        // Admin institutions
        Route::get('/institutions',            [AdminInstitutionController::class, 'index']);
        Route::patch('/institutions/{id}/status', [AdminInstitutionController::class, 'updateStatus']);
        Route::patch('/institutions/{id}/verify', [AdminInstitutionController::class, 'verify']);
    });
});