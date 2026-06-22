<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AccountController extends Controller
{
    // PATCH /*/account — update phone or password
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'phone'            => 'sometimes|nullable|string|max:30',
            'current_password' => 'sometimes|required_with:password|string',
            'password'         => 'sometimes|string|min:8|confirmed',
        ]);

        if (isset($data['password'])) {
            if (!Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }
            $user->password = Hash::make($data['password']);
        }

        if (array_key_exists('phone', $data)) {
            $user->phone = $data['phone'];
        }

        $user->save();
        return response()->json(['message' => 'Account updated.', 'user' => $user]);
    }

    // POST /*/account/avatar
    public function avatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|image|max:2048']);
        $user = $request->user();
        $disk = app()->environment('production') ? 'r2' : 'public';

        if ($user->avatar) {
            try { Storage::disk($disk)->delete($user->avatar); } catch (\Throwable) {}
        }

        $path = $request->file('avatar')->store("avatars/{$user->id}", $disk);
        $user->update(['avatar' => $path]);

        return response()->json(['avatar_url' => Storage::disk($disk)->url($path)]);
    }

    // GET/PATCH for agency settings (name, description, website)
    public function agencySettings(Request $request): JsonResponse
    {
        $profile = $request->user()->agencyProfile;
        if ($request->isMethod('GET')) {
            return response()->json($profile);
        }
        $data = $request->validate([
            'agency_name'  => 'sometimes|string|max:255',
            'description'  => 'sometimes|nullable|string',
            'website'      => 'sometimes|nullable|url',
            'phone'        => 'sometimes|nullable|string|max:30',
        ]);
        $profile?->update($data);
        return response()->json($profile?->fresh());
    }

    // POST /affiliate/change-password  (same logic, alias)
    public function changePassword(Request $request): JsonResponse
    {
        return $this->update($request);
    }
}
