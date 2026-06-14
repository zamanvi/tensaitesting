<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'tagline', 'description',
        'city', 'country', 'address', 'phone', 'email', 'whatsapp',
        'google_maps_url', 'logo', 'cover_image',
        'working_hours', 'social_links', 'stats',
        'is_active', 'sort_order',
    ];

    protected $casts = [
        'working_hours' => 'array',
        'social_links'  => 'array',
        'stats'         => 'array',
        'is_active'     => 'boolean',
    ];

    protected $appends = ['logo_url', 'cover_image_url'];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function teamMembers()
    {
        return $this->hasMany(BranchTeamMember::class)->orderBy('sort_order');
    }

    public function galleryItems()
    {
        return $this->hasMany(BranchGalleryItem::class)->orderBy('sort_order');
    }

    public function services()
    {
        return $this->hasMany(BranchService::class)->orderBy('sort_order');
    }

    public function admins()
    {
        return $this->hasMany(User::class)->whereHas('roles', fn ($q) => $q->whereIn('name', ['branch_admin', 'branch_manager']));
    }

    public function managers()
    {
        return $this->hasMany(User::class)->whereHas('roles', fn ($q) => $q->where('name', 'branch_manager'));
    }

    // ── Computed URLs ──────────────────────────────────────────────────────────

    private function fileUrl(?string $path): ?string
    {
        if (!$path) return null;
        if (app()->environment('production')) {
            $r2Url = env('R2_URL', '');
            if ($r2Url && !str_contains($r2Url, 'r2.cloudflarestorage.com')) {
                return rtrim($r2Url, '/') . '/' . ltrim($path, '/');
            }
            return rtrim(env('APP_URL', 'https://tensai-production-3af6.up.railway.app'), '/') . '/api/branches/file?path=' . urlencode($path);
        }
        return Storage::disk('public')->url($path);
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->fileUrl($this->logo);
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->fileUrl($this->cover_image);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
