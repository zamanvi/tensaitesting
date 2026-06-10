<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

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
