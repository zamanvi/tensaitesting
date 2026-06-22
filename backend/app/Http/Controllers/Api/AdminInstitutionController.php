<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
