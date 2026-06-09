<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\StudentProfile;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\EmailVerificationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'phone' => 'nullable|string|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'gateway_type'   => 'required|in:student,agency,institution,affiliate',
            'affiliate_type' => 'nullable|in:local,global|required_if:gateway_type,affiliate',
            'affiliate_code' => 'nullable|string|exists:users,affiliate_code',
        ]);

        $referredBy = !empty($validated['affiliate_code'])
            ? User::where('affiliate_code', $validated['affiliate_code'])->value('id')
            : null;

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'gateway_type' => $validated['gateway_type'],
            'status' => 'pending',
            'affiliate_code' => 'TEN-' . strtoupper(Str::random(8)),
            'referred_by' => $referredBy,
            'email_verification_code' => $code,
            'email_verification_expires_at' => now()->addMinutes(30),
        ]);

        try {
            $user->notify(new EmailVerificationNotification($code));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Verification email failed: ' . $e->getMessage());
        }

        $user->assignRole($validated['gateway_type']);

        // Auto-create profile shell
        match ($validated['gateway_type']) {
            'student'   => StudentProfile::create(['user_id' => $user->id]),
            'affiliate' => AffiliateProfile::create([
                'user_id'        => $user->id,
                'affiliate_type' => $validated['affiliate_type'],
                'type_confirmed' => true,
            ]),
            default => null,
        };

        $token = $user->createToken('tensai-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Awaiting verification.',
            'user' => $user->load($validated['gateway_type'] . 'Profile'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($user->status === 'suspended') {
            return response()->json(['message' => 'Account suspended. Contact support.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('tensai-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'user'    => $user,
            'token'   => $token,
            'roles'   => $user->getRoleNames(),
            'gateway_type' => $user->gateway_type,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = match ($user->gateway_type) {
            'student' => $user->studentProfile,
            'agency' => $user->agencyProfile,
            'institution' => $user->institutionProfile,
            'affiliate' => $user->affiliateProfile,
            default => null,
        };

        return response()->json([
            'user' => $user,
            'profile' => $profile,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'code'  => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->email_verification_code !== $request->code) {
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        if ($user->email_verification_expires_at && now()->isAfter($user->email_verification_expires_at)) {
            return response()->json(['message' => 'Verification code expired. Request a new one.'], 422);
        }

        $user->update([
            'email_verified_at' => now(),
            'status' => 'active',
            'email_verification_code' => null,
            'email_verification_expires_at' => null,
        ]);

        return response()->json(['message' => 'Email verified successfully. Account is now active.']);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->email_verified_at) {
            return response()->json(['message' => 'If that account exists and is unverified, a new code has been sent.']);
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'email_verification_code' => $code,
            'email_verification_expires_at' => now()->addMinutes(30),
        ]);

        try {
            $user->notify(new EmailVerificationNotification($code));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Resend verification failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'If that account exists and is unverified, a new code has been sent.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        Password::sendResetLink(
            $request->only('email'),
            function (User $user, string $token) {
                $frontend = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'https://tensai-kappa.vercel.app')), '/');
                $url = $frontend . '/auth/reset-password?token=' . $token . '&email=' . urlencode($user->email);
                try {
                    $user->notify(new ResetPasswordNotification($url));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Password reset mail failed: ' . $e->getMessage() . ' | Reset URL: ' . $url);
                }
            }
        );

        return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)]);
                $user->save();
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successfully. Please sign in.']);
        }

        return response()->json(['message' => 'Invalid or expired reset token.'], 422);
    }
}
