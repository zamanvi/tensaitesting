<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Application extends Model
{
    protected $fillable = [
        'application_code', 'form_template_id', 'user_id', 'submitted_by_role',
        'branch_id', 'student_name', 'student_email', 'student_phone', 'whatsapp_no', 'permanent_address',
        'form_data', 'progress', 'status', 'submitted_at',
    ];

    protected $casts = [
        'form_data'    => 'array',
        'submitted_at' => 'datetime',
        'progress'     => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Application $app) {
            $app->application_code = 'APP-' . date('Y') . '-' . strtoupper(Str::random(8));
        });
    }

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function recalculateProgress(): int
    {
        $template = FormTemplate::with('activeFieldGroups.activeBoxes.activeFields')
            ->find($this->form_template_id);

        if (!$template) return 0;

        $data = $this->form_data ?? [];

        // ── Core personal-info fields (stored as top-level columns) ───────────
        $coreFields = ['student_name', 'student_phone'];
        $totalCore  = count($coreFields);
        $filledCore = collect($coreFields)->filter(fn ($col) => !empty($this->$col))->count();

        // ── Template fields ───────────────────────────────────────────────────
        $allFields = collect();
        foreach ($template->activeFieldGroups as $group) {
            foreach ($group->activeBoxes as $box) {
                foreach ($box->activeFields as $field) {
                    $allFields->push($field);
                }
            }
        }

        $total  = $allFields->count();
        $filled = $allFields->filter(fn ($f) => isset($data[$f->field_key]) && $data[$f->field_key] !== '')->count();

        $uploadedKeys = $this->documents()->pluck('field_key')->toArray();
        $docFields    = $allFields->filter(fn ($f) => $f->requires_document);
        $totalDocs    = $docFields->count();
        $filledDocs   = $docFields->filter(fn ($f) => in_array($f->field_key, $uploadedKeys))->count();

        // ── Education entries (non-none) count toward progress ────────────────
        $educations = collect($template->educations ?? [])
            ->filter(fn ($e) => ($e['requirement'] ?? 'none') !== 'none')
            ->values();

        foreach ($educations as $i => $edu) {
            $total++;
            // institution field = the primary fill indicator
            if (isset($data["edu_{$i}_institution"]) && $data["edu_{$i}_institution"] !== '') {
                $filled++;
            }

            // Each education entry counts as a document slot
            $docKey = "edu_{$i}";
            $totalDocs++;
            // Uploaded via API (application_documents table) OR via admin (form_data.edu_N_document)
            if (in_array($docKey, $uploadedKeys) ||
                (isset($data["{$docKey}_document"]) && $data["{$docKey}_document"] !== '')) {
                $filledDocs++;
            }
        }

        $total  += $totalCore;
        $filled += $filledCore;

        if ($total === 0) return 0;

        $fieldPct = ($filled / $total) * ($totalDocs > 0 ? 70 : 100);
        $docPct   = $totalDocs > 0 ? ($filledDocs / $totalDocs) * 30 : 0;

        return (int) min(100, round($fieldPct + $docPct));
    }
}