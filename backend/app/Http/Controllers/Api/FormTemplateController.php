<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormTemplate;
use Illuminate\Http\JsonResponse;

class FormTemplateController extends Controller
{
    // GET /api/form-templates/{country}
    // Returns the active template + fields for a given country.
    // Falls back to a "Global" template if no country-specific one exists.
    public function show(string $country): JsonResponse
    {
        $template = FormTemplate::with('activeFields')
            ->where('is_active', true)
            ->where('country', $country)
            ->first();

        // Fallback to Global template
        if (!$template) {
            $template = FormTemplate::with('activeFields')
                ->where('is_active', true)
                ->where('country', 'Global')
                ->first();
        }

        if (!$template) {
            return response()->json(null); // no template configured
        }

        return response()->json([
            'id'             => $template->id,
            'country'        => $template->country,
            'name'           => $template->name,
            'intake_options' => $template->intake_options ?? [],
            'fields'         => $template->activeFields->map(fn ($f) => [
                'id'          => $f->id,
                'field_key'   => $f->field_key,
                'label'       => $f->label,
                'section'     => $f->section,
                'field_type'  => $f->field_type,
                'is_required'        => $f->is_required,
                'requires_document'  => $f->requires_document,
                'options'            => $f->options ?? [],
                'placeholder'        => $f->placeholder,
                'helper_text'        => $f->helper_text,
                'sort_order'         => $f->sort_order,
            ])->values(),
        ]);
    }

    // GET /api/form-templates (list all active countries — for dropdown hints)
    public function index(): JsonResponse
    {
        $templates = FormTemplate::where('is_active', true)
            ->orderBy('country')
            ->get(['id', 'country', 'name', 'intake_options']);

        return response()->json($templates);
    }
}
