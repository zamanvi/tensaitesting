<?php

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\StudentProfileController;
use App\Http\Controllers\Api\AgencyController;
use App\Http\Controllers\Api\AgencyProfileController;
use App\Http\Controllers\Api\InstitutionController;
use App\Http\Controllers\Api\OcrController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\CommissionController;
use App\Http\Controllers\Api\AffiliateProfileController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\AdminGalleryController;
use App\Models\Setting;
use App\Http\Controllers\Api\HelpRequestController;
use App\Http\Controllers\Api\AdminUserController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json(['status' => 'ok', 'db' => 'connected', 'app' => 'Tensai API']);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'db' => 'disconnected'], 500);
    }
});

// Gallery (public)
Route::get('/settings/public', fn() => response()->json([
    'support_whatsapp' => Setting::get('support_whatsapp', '8801826192179'),
    'support_phone'    => Setting::get('support_phone', '+8801826192179'),
]));

Route::get('/gallery', [GalleryController::class, 'index']);
Route::get('/gallery/featured', [GalleryController::class, 'featured']);

// Public auth endpoints — rate-limited to prevent brute-force attacks
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

    // Student gateway
    Route::prefix('student')->middleware('role:student')->group(function () {
        Route::get('/profile', [StudentProfileController::class, 'show']);
        Route::put('/profile', [StudentProfileController::class, 'update']);
        Route::post('/ocr/upload', [OcrController::class, 'upload']);
        Route::post('/ocr/review-request', [OcrController::class, 'requestReview']);
        Route::post('/help-request', [HelpRequestController::class, 'store']);
        Route::get('/help-requests', [HelpRequestController::class, 'myRequests']);
        Route::get('/leads', [LeadController::class, 'myLeads']);
        Route::get('/interviews', [InterviewController::class, 'myInterviews']);
    });

    // Agency gateway
    Route::prefix('agency')->middleware('role:agency')->group(function () {
        Route::get('/profile',  [AgencyProfileController::class, 'show']);
        Route::post('/profile', [AgencyProfileController::class, 'upsert']);
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
        Route::post('/profile', [InstitutionController::class, 'updateProfile']); // POST for multipart/form-data (logo upload)
        Route::get('/leads', [InstitutionController::class, 'myLeads']);
        Route::get('/students', [StudentProfileController::class, 'institutionBrowse']);
        Route::post('/shortlist/{student}', [StudentProfileController::class, 'shortlist']);
        Route::post('/interview-request/{lead}', [InterviewController::class, 'institutionRequest']);
        Route::get('/interviews', [InterviewController::class, 'institutionInterviews']);
    });

    // Affiliate gateway
    Route::prefix('affiliate')->middleware('role:affiliate')->group(function () {
        Route::get('/profile',  [AffiliateProfileController::class, 'show']);
        Route::post('/profile', [AffiliateProfileController::class, 'upsert']);
        Route::get('/dashboard', [CommissionController::class, 'affiliateDashboard']);
        Route::get('/referrals', [CommissionController::class, 'referrals']);
        Route::get('/earnings', [CommissionController::class, 'earnings']);
        Route::post('/upgrade-request', [CommissionController::class, 'upgradeRequest']);
    });

    // Admin only
    Route::prefix('admin')->middleware('role:admin|super_admin')->group(function () {
        Route::get('/leads', [LeadController::class, 'adminIndex']);
        Route::put('/leads/{lead}/assign-agency', [LeadController::class, 'assignAgency']);
        Route::put('/leads/{lead}/status', [LeadController::class, 'updateStatus']);
        Route::post('/ocr/{job}/approve', [OcrController::class, 'approve']);
        Route::post('/ocr/{job}/reject', [OcrController::class, 'reject']);
        Route::post('/interviews/{interview}/arrange', [InterviewController::class, 'arrange']);
        Route::get('/commissions', [CommissionController::class, 'index']);
        Route::get('/users',                      [AdminUserController::class, 'index']);
        Route::get('/agencies',                   [AgencyController::class, 'index']);
        Route::post('/agencies/{agency}/approve', [AgencyController::class, 'approve']);
        Route::post('/agencies/{agency}/reject',  [AgencyController::class, 'reject']);

        // Gallery management
        Route::get('/gallery',                          [AdminGalleryController::class, 'index']);
        Route::post('/gallery',                         [AdminGalleryController::class, 'store']);
        Route::post('/gallery/{gallery}',               [AdminGalleryController::class, 'update']); // POST for multipart/form-data
        Route::post('/gallery/{gallery}/toggle',        [AdminGalleryController::class, 'toggle']);
        Route::delete('/gallery/{gallery}',             [AdminGalleryController::class, 'destroy']);
    });
});
