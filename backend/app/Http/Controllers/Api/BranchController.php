<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BranchController extends Controller
{
    /** List all active branches */
    public function index(): JsonResponse
    {
        $branches = Branch::active()
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'tagline', 'city', 'country',
                   'address', 'phone', 'email', 'whatsapp', 'logo', 'cover_image',
                   'stats', 'is_active', 'sort_order'])
            ->map(fn ($b) => $b->toArray());

        return response()->json($branches);
    }

    /** Single branch with full details */
    public function show(string $slug): JsonResponse
    {
        $branch = Branch::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $data = array_merge($branch->toArray(), [
            'team'    => $branch->teamMembers()->where('is_active', true)->get()
                ->map(fn ($m) => $m->toArray()),
            'gallery' => $branch->galleryItems()->where('is_active', true)->get()
                ->map(fn ($g) => $g->toArray()),
            'services' => $branch->services()->where('is_active', true)->get(),
        ]);

        return response()->json($data);
    }

    /** Branch admin updates their own branch contact info */
    public function updateContact(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->branch_id) {
            return response()->json(['message' => 'You are not assigned to a branch.'], 403);
        }

        $validated = $request->validate([
            'phone'    => 'nullable|string|max:30',
            'whatsapp' => 'nullable|string|max:30',
            'address'  => 'nullable|string|max:500',
        ]);

        $branch = Branch::findOrFail($user->branch_id);
        $branch->update($validated);

        return response()->json([
            'message' => 'Contact info updated.',
            'branch'  => $branch->only(['id', 'name', 'phone', 'whatsapp', 'address']),
        ]);
    }

    /** Branch admin fetches their own branch */
    public function myBranch(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->branch_id) {
            return response()->json(['message' => 'You are not assigned to a branch.'], 403);
        }

        $branch = Branch::findOrFail($user->branch_id);

        return response()->json($branch->only([
            'id', 'name', 'slug', 'city', 'country',
            'phone', 'whatsapp', 'address', 'email',
        ]));
    }

    // ── Admin-only methods ────────────────────────────────────────────────────

    /** List all branches with their assigned admin users */
    public function adminIndex(): JsonResponse
    {
        $branches = Branch::orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'city', 'country', 'is_active', 'sort_order'])
            ->map(function ($branch) {
                $admins = User::where('branch_id', $branch->id)
                    ->whereHas('roles', fn ($q) => $q->whereIn('name', ['branch_admin', 'branch_manager']))
                    ->get(['id', 'name', 'email', 'status', 'manager_plain_password', 'created_at'])
                    ->map(fn ($u) => [
                        'id'             => $u->id,
                        'name'           => $u->name,
                        'email'          => $u->email,
                        'status'         => $u->status,
                        'plain_password' => $u->manager_plain_password,
                        'created_at'     => $u->created_at,
                    ]);

                return array_merge($branch->toArray(), ['admins' => $admins]);
            });

        return response()->json($branches);
    }

    /** Create a new branch admin user for a given branch */
    public function createAdmin(Request $request, int $branchId): JsonResponse
    {
        $branch = Branch::findOrFail($branchId);

        $validated = $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
        ]);

        $password = $validated['password'] ?? Str::random(10);

        $user = User::create([
            'name'                  => $validated['name'],
            'email'                 => $validated['email'],
            'password'              => Hash::make($password),
            'gateway_type'          => 'branch',
            'status'                => 'active',
            'branch_id'             => $branch->id,
            'manager_plain_password'=> $password,
            'email_verified_at'     => now(),
        ]);

        $user->assignRole('branch_admin');

        return response()->json([
            'message'  => 'Branch admin created successfully.',
            'admin'    => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'password' => $password,
                'branch'   => $branch->name,
            ],
        ], 201);
    }

    /** Proxy-serve a branch file from R2 (when no public CDN URL) */
    public function serveFile(Request $request): Response
    {
        $path = $request->query('path');
        if (!$path) abort(404);

        $disk = app()->environment('production') ? 'r2' : 'public';

        try {
            $contents = Storage::disk($disk)->get($path);
        } catch (\Exception $e) {
            abort(404);
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mimeMap = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
        $mimeType = $mimeMap[$ext] ?? 'image/jpeg';

        return response($contents, 200)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=86400');
    }
}
