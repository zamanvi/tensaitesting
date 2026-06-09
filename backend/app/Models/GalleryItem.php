<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class GalleryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'content',
        'image_url', 'image_path',
        'category', 'is_featured', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_active'   => 'boolean',
    ];

    protected $appends = ['display_image_url'];

    public function getDisplayImageUrlAttribute(): string
    {
        if ($this->image_path) {
            if (app()->environment('production')) {
                $r2Url = env('R2_URL', '');
                // Only use R2_URL if it's a proper public CDN URL.
                // The private API endpoint (r2.cloudflarestorage.com) requires auth — browsers can't load it.
                $isPublicCdn = $r2Url && !str_contains($r2Url, 'r2.cloudflarestorage.com');
                if ($isPublicCdn) {
                    return rtrim($r2Url, '/') . '/' . ltrim($this->image_path, '/');
                }
                // Fall back to backend proxy — streams the image through Railway
                $appUrl = rtrim(env('APP_URL', 'https://tensai-production-3af6.up.railway.app'), '/');
                return $appUrl . '/api/gallery/image/' . $this->id;
            }
            // Local dev: use public disk URL
            return Storage::disk('public')->url($this->image_path);
        }
        return $this->image_url ?? '';
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
