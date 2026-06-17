<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormTemplate;
use Illuminate\Http\JsonResponse;

class FormTemplateController extends Controller
{
    // GET /api/form-templates/{country}
    public function show(string $country): JsonResponse
    {
        $template = $this->findTemplate($country);

        if (!$template) {
            return response()->json(null);
        }

        return response()->json($this->formatTemplate($template));
    }

    // GET /api/form-templates
    public function index(): JsonResponse
    {
        $templates = FormTemplate::where('is_active', true)
            ->orderBy('country')
            ->get(['id', 'country', 'name', 'intake_options']);

        return response()->json($templates);
    }

    // ──────────────────────────────────────────────────────────────────────────

    private function findTemplate(string $country): ?FormTemplate
    {
        $template = FormTemplate::with(['activeFieldGroups.activeFields'])
            ->where('is_active', true)
            ->where('country', $country)
            ->first();

        if (!$template) {
            $template = FormTemplate::with(['activeFieldGroups.activeFields'])
                ->where('is_active', true)
                ->where('country', 'Global')
                ->first();
        }

        return $template;
    }

    private function formatTemplate(FormTemplate $template): array
    {
        $groups = $template->activeFieldGroups->map(fn ($group) => [
            'id'     => $group->id,
            'label'  => $group->label,
            'hint'   => $group->hint,
            'fields' => $group->activeFields->map(fn ($f) => $this->formatField($f))->values(),
        ])->values();

        // Ungrouped fields (form_field_group_id is null) — keep backwards compat
        $ungrouped = $template->activeFields()
            ->whereNull('form_field_group_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($f) => $this->formatField($f))
            ->values();

        return [
            'id'             => $template->id,
            'country'        => $template->country,
            'name'           => $template->name,
            'intake_options' => $template->intake_options ?? [],
            'groups'         => $groups,
            'fields'         => $ungrouped, // legacy / ungrouped fields
        ];
    }

    private function formatField($f): array
    {
        return [
            'id'                     => $f->id,
            'field_key'              => $f->field_key,
            'label'                  => $f->label,
            'section'                => $f->section,
            'field_type'             => $f->field_type,
            'box_size'               => $f->box_size ?? 'middle',
            'is_required'            => $f->is_required,
            'requires_document'      => $f->requires_document,
            'options'                => $f->options ?? [],
            'placeholder'            => $f->placeholder,
            'helper_text'            => $f->helper_text,
            'sort_order'             => $f->sort_order,
            'conditional_field_key'  => $f->conditional_field_key,
            'conditional_operator'   => $f->conditional_operator,
            'conditional_value'      => $f->conditional_value,
        ];
    }
}
