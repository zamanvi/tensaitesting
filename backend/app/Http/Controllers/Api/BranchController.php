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
            ->map(fn ($b) => array_merge($b->toArray(), [
                'logo_url'        => $b->logo_url,
                'cover_image_url' => $b->cover_image_url,
            ]));

        return response()->json($branches);
    }

    /** Single branch with full details */
    public function show(string $slug): JsonResponse
    {
        $branch = Branch::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $data = array_merge($branch->toArray(), [
            'logo_url'        => $branch->logo_url,
            'cover_image_url' => $branch->cover_image_url,
            'team'            => $branch->teamMembers()->where('is_active', true)->get()
                ->map(fn ($m) => array_merge($m->toArray(), ['photo_url' => $m->photo_url])),
            'gallery'         => $branch->galleryItems()->where('is_active', true)->get()
                ->map(fn ($g) => array_merge($g->toArray(), ['display_image_url' => $g->display_image_url])),
            'services'        => $branch->services()->where('is_active', true)->get(),
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
