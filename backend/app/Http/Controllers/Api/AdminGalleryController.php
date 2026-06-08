<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalleryItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminGalleryController extends Controller
{
    /** List all gallery items (admin — includes inactive) */
    public function index(): JsonResponse
    {
        $items = GalleryItem::orderBy('sort_order')->orderByDesc('created_at')->get();
        return response()->json($items->map(fn ($i) => array_merge($i->toArray(), ['display_image_url' => $i->display_image_url])));
    }

    /** Create a new gallery item (with optional image upload) */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category'    => 'required|in:students,japan,milestones,agencies,events,docs,departures,institutes',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'image_url'   => 'nullable|url|max:500',
            'is_featured' => 'boolean',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $imagePath = null;

        if ($request->hasFile('image')) {
            $disk = config('filesystems.disks.r2.key') ? 'r2' : 'public';
            $file = $request->file('image');
            $filename = 'gallery/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($disk)->put($filename, file_get_contents($file->getRealPath()));
            $imagePath = $filename;
        }

        $item = GalleryItem::create([
            'title'       => $request->title,
            'description' => $request->description,
            'category'    => $request->category,
            'image_url'   => $request->image_url,
            'image_path'  => $imagePath,
            'is_featured' => $request->boolean('is_featured', false),
            'is_active'   => $request->boolean('is_active', true),
            'sort_order'  => $request->sort_order ?? 0,
        ]);

        return response()->json([
            'message' => 'Gallery item created.',
            'item'    => array_merge($item->toArray(), ['display_image_url' => $item->display_image_url]),
        ], 201);
    }

    /** Update an existing gallery item */
    public function update(Request $request, GalleryItem $gallery): JsonResponse
    {
        $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category'    => 'sometimes|in:students,japan,milestones,agencies,events,docs,departures,institutes',
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
            'image_url'   => 'nullable|url|max:500',
            'is_featured' => 'boolean',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if stored locally
            if ($gallery->image_path) {
                $disk = config('filesystems.disks.r2.key') ? 'r2' : 'public';
                Storage::disk($disk)->delete($gallery->image_path);
            }
            $disk = config('filesystems.disks.r2.key') ? 'r2' : 'public';
            $file = $request->file('image');
            $filename = 'gallery/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($disk)->put($filename, file_get_contents($file->getRealPath()));
            $gallery->image_path = $filename;
            $gallery->image_url  = null;
        } elseif ($request->has('image_url')) {
            $gallery->image_url  = $request->image_url;
            $gallery->image_path = null;
        }

        $gallery->fill($request->only(['title', 'description', 'category', 'is_featured', 'is_active', 'sort_order']));
        $gallery->save();

        return response()->json([
            'message' => 'Gallery item updated.',
            'item'    => array_merge($gallery->toArray(), ['display_image_url' => $gallery->display_image_url]),
        ]);
    }

    /** Toggle active/featured status */
    public function toggle(Request $request, GalleryItem $gallery): JsonResponse
    {
        $request->validate(['field' => 'required|in:is_active,is_featured']);
        $field = $request->field;
        $gallery->update([$field => ! $gallery->$field]);
        return response()->json(['message' => 'Toggled.', 'item' => $gallery->fresh()]);
    }

    /** Delete a gallery item */
    public function destroy(GalleryItem $gallery): JsonResponse
    {
        if ($gallery->image_path) {
            $disk = config('filesystems.disks.r2.key') ? 'r2' : 'public';
            Storage::disk($disk)->delete($gallery->image_path);
        }
        $gallery->delete();
        return response()->json(['message' => 'Gallery item deleted.']);
    }
}
