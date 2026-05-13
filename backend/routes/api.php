<?php

use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GalleryController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\StudentProfileController;
use App\Http\Controllers\Api\AgencyController;
use App\Http\Controllers\Api\InstitutionController;
use App\Http\Controllers\Api\OcrController;
use App\Http\Controllers\Api\InterviewController;
use App\Http\Controllers\Api\CommissionController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/health', function () {
    $db = 'disconnected';
    try { DB::connection()->getPdo(); $db = 'connected'; } catch (\Exception $e) {}
    return response()->json(['status' => 'ok', 'db' => $db, 'app' => 'Tensai API']);
});

// Public — gallery (no auth required)
Route::get('/gallery', [GalleryController::class, 'index']);
Route::get('/gallery/featured', [GalleryController::class, 'featured']);

// Public
Route::middleware('throttle:5,1')->post('/auth/register', [AuthController::class, 'register']);
Route::middleware('throttle:10,1')->post('/auth/login', [AuthController::class, 'login']);
Route::middleware('throttle:5,1')->post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::middleware('throttle:5,1')->post('/auth/reset-password', [AuthController::class, 'resetPassword']);

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
        Route::get('/leads', [LeadController::class, 'myLeads']);
        Route::get('/interviews', [InterviewController::class, 'myInterviews']);
    });

    // Agency gateway
    Route::prefix('agency')->middleware('role:agency')->group(function () {
        Route::get('/leads/private-vault', [LeadController::class, 'privateVault']);
        Route::get('/leads/open-pool', [LeadController::class, 'openPool']);
        Route::post('/leads/{lead}/publish', [LeadController::class, 'publishToOpenPool']);
        Route::post('/leads/{lead}/forward', [LeadController::class, 'forwardLead']);
        Route::post('/leads/{lead}/unlock', [LeadController::class, 'unlockLead']);
        Route::get('/students/{student}/profile', [StudentProfileController::class, 'agencyView']);
        Route::post('/interview-request/{lead}', [InterviewController::class, 'request']);
    });

    // Institution gateway
    Route::prefix('institution')->middleware('role:institution')->group(function () {
        Route::get('/students', [StudentProfileController::class, 'institutionBrowse']);
        Route::post('/shortlist/{student}', [StudentProfileController::class, 'shortlist']);
        Route::post('/interview-request/{lead}', [InterviewController::class, 'institutionRequest']);
        Route::get('/interviews', [InterviewController::class, 'institutionInterviews']);
    });

    // Affiliate gateway
    Route::prefix('affiliate')->middleware('role:affiliate')->group(function () {
        Route::get('/dashboard', [CommissionController::class, 'affiliateDashboard']);
        Route::get('/referrals', [CommissionController::class, 'referrals']);
        Route::get('/earnings', [CommissionController::class, 'earnings']);
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
        Route::post('/agencies/{agency}/approve', [AgencyController::class, 'approve']);
        Route::post('/agencies/{agency}/reject', [AgencyController::class, 'reject']);
    });
});
