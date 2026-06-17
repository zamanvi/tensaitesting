<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BranchGalleryItem extends Model
{
    protected $fillable = [
        'branch_id', 'image_path', 'image_url',
        'title', 'description', 'caption', 'is_active', 'sort_order',
    ];

    protected $casts = ['is_active' => 'boolean'];
    protected $appends = ['display_image_url'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function getDisplayImageUrlAttribute(): string
    {
        if ($this->image_path) {
            if (app()->environment('production')) {
                $r2Url = env('R2_URL', '');
                if ($r2Url && !str_contains($r2Url, 'r2.cloudflarestorage.com')) {
                    return rtrim($r2Url, '/') . '/' . ltrim($this->image_path, '/');
                }
                return rtrim(env('APP_URL', 'https://tensai-production-3af6.up.railway.app'), '/') . '/api/branches/file?path=' . urlencode($this->image_path);
            }
            return Storage::disk('public')->url($this->image_path);
        }
        return $this->image_url ?? '';
    }
}
