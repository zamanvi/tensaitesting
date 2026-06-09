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
    private function disk(): string
    {
        return app()->environment('production') ? 'r2' : 'public';
    }

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
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,webp|max:8192',
            'image_url'   => 'nullable|url|max:500',
            'is_featured' => 'nullable',
            'is_active'   => 'nullable',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $imagePath = null;

        if ($request->hasFile('image')) {
            $file     = $request->file('image');
            $filename = 'gallery/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($this->disk())->put($filename, file_get_contents($file->getRealPath()));
            $imagePath = $filename;
        }

        $item = GalleryItem::create([
            'title'       => $request->title,
            'description' => $request->description,
            'category'    => $request->category,
            'image_url'   => $imagePath ? null : $request->image_url,
            'image_path'  => $imagePath,
            'is_featured' => filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN),
            'is_active'   => filter_var($request->is_active  ?? true, FILTER_VALIDATE_BOOLEAN),
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
            'image'       => 'nullable|file|mimes:jpg,jpeg,png,webp|max:8192',
            'image_url'   => 'nullable|url|max:500',
            'is_featured' => 'nullable',
            'is_active'   => 'nullable',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        if ($request->hasFile('image')) {
            // Delete old uploaded image
            if ($gallery->image_path) {
                Storage::disk($this->disk())->delete($gallery->image_path);
            }
            $file     = $request->file('image');
            $filename = 'gallery/' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            Storage::disk($this->disk())->put($filename, file_get_contents($file->getRealPath()));
            $gallery->image_path = $filename;
            $gallery->image_url  = null;
        } elseif ($request->filled('image_url')) {
            $gallery->image_url  = $request->image_url;
            $gallery->image_path = null;
        }

        if ($request->filled('title'))       $gallery->title       = $request->title;
        if ($request->filled('category'))    $gallery->category    = $request->category;
        if ($request->has('description'))    $gallery->description = $request->description;
        if ($request->has('sort_order'))     $gallery->sort_order  = $request->sort_order;
        if ($request->has('is_featured'))    $gallery->is_featured = filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('is_active'))      $gallery->is_active   = filter_var($request->is_active,   FILTER_VALIDATE_BOOLEAN);

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
        return response()->json(['message' => 'Toggled.', 'item' => array_merge($gallery->fresh()->toArray(), ['display_image_url' => $gallery->display_image_url])]);
    }

    /** Delete a gallery item */
    public function destroy(GalleryItem $gallery): JsonResponse
    {
        if ($gallery->image_path) {
            Storage::disk($this->disk())->delete($gallery->image_path);
        }
        $gallery->delete();
        return response()->json(['message' => 'Gallery item deleted.']);
    }
}
