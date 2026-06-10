<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BranchTeamMember extends Model
{
    protected $fillable = [
        'branch_id', 'name', 'role', 'bio',
        'photo', 'email', 'phone', 'is_active', 'sort_order',
    ];

    protected $casts = ['is_active' => 'boolean'];
    protected $appends = ['photo_url'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo) return null;
        if (app()->environment('production')) {
            $r2Url = env('R2_URL', '');
            if ($r2Url && !str_contains($r2Url, 'r2.cloudflarestorage.com')) {
                return rtrim($r2Url, '/') . '/' . ltrim($this->photo, '/');
            }
            return rtrim(env('APP_URL', 'https://tensai-production-3af6.up.railway.app'), '/') . '/api/branches/file?path=' . urlencode($this->photo);
        }
        return Storage::disk('public')->url($this->photo);
    }
}
