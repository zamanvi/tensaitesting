<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Post extends Model
{
    protected $fillable = [
        'title', 'slug', 'excerpt', 'body', 'type',
        'video_url', 'thumbnail_url', 'thumbnail_file', 'status', 'is_premium', 'published_at', 'created_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_premium'   => 'boolean',
    ];

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function getYoutubeIdAttribute(): ?string
    {
        if (!$this->video_url) return null;
        preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $this->video_url, $m);
        return $m[1] ?? null;
    }

    public function getThumbnailAttribute(): ?string
    {
        if ($this->thumbnail_file) {
            $disk = app()->environment('production') ? 'r2' : 'public';
            return \Illuminate\Support\Facades\Storage::disk($disk)->url($this->thumbnail_file);
        }
        if ($this->thumbnail_url) return $this->thumbnail_url;
        if ($this->youtube_id) return "https://img.youtube.com/vi/{$this->youtube_id}/hqdefault.jpg";
        return null;
    }
}
