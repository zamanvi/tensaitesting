<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormTemplate;
use Illuminate\Http\JsonResponse;

class FormTemplateController extends Controller
{
    // GET /api/form-templates/{id}  — fetch by template ID (unambiguous with multiple per country)
    public function show(int $id): JsonResponse
    {
        $template = FormTemplate::with(['activeFieldGroups.activeBoxes.activeFields'])
            ->where('status', 'published')
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json($this->formatTemplate($template));
    }

    // GET /api/form-templates  — list all published templates (country + visa_type + name)
    public function index(): JsonResponse
    {
        $templates = FormTemplate::where('status', 'published')
            ->where('is_active', true)
            ->orderBy('country')
            ->orderBy('visa_type')
            ->get(['id', 'country', 'visa_type', 'name', 'intake_options', 'educations']);

        return response()->json($templates);
    }

    private function formatTemplate(FormTemplate $template): array
    {
        $groups = $template->activeFieldGroups->map(fn ($group) => [
            'id'    => $group->id,
            'label' => $group->label,
            'hint'  => $group->hint,
            'boxes' => $group->activeBoxes->map(fn ($box) => [
                'id'                 => $box->id,
                'name'               => $box->name,
                'requires_document'  => $box->requires_document,
                'fields'             => $box->activeFields->map(fn ($f) => $this->formatField($f))->values(),
            ])->values(),
        ])->values();

        $educations = collect($template->educations ?? [])
            ->filter(fn ($e) => ($e['requirement'] ?? 'none') !== 'none')
            ->values();

        return [
            'id'             => $template->id,
            'country'        => $template->country,
            'visa_type'      => $template->visa_type,
            'name'           => $template->name,
            'intake_options' => $template->intake_options ?? [],
            'groups'         => $groups,
            'educations'     => $educations,
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
