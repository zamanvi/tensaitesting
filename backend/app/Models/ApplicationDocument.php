<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ApplicationDocument extends Model
{
    protected $fillable = [
        'application_form_id', 'application_id', 'doc_type', 'field_key',
        'label', 'file_path', 'original_name', 'file_size', 'mime_type',
    ];

    protected $appends = ['url'];

    public function applicationForm(): BelongsTo
    {
        return $this->belongsTo(ApplicationForm::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function getUrlAttribute(): string
    {
        if (!$this->file_path) return '';

        if (app()->environment('production')) {
            $r2Url = env('R2_URL', '');
            if ($r2Url && !str_contains($r2Url, 'r2.cloudflarestorage.com')) {
                return rtrim($r2Url, '/') . '/' . ltrim($this->file_path, '/');
            }
            return rtrim(env('APP_URL', ''), '/') . '/api/branches/file?path=' . urlencode($this->file_path);
        }

        return Storage::disk('public')->url($this->file_path);
    }
}