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
            $disk = config('filesystems.disks.r2.key') ? 'r2' : 'public';
            return Storage::disk($disk)->url($this->image_path);
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
