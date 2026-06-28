<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\FormTemplate;
use App\Models\FormFieldGroup;
use App\Models\FormFieldBox;
use App\Models\FormTemplateField;

return new class extends Migration
{
    public function up(): void
    {
        $template = FormTemplate::find(48);
        if (! $template) return;

        // ── 1. Remove duplicate bachelors + add intake options ──────────────
        $educations = collect($template->educations ?? []);
        $seenLevels = [];
        $cleaned = $educations->filter(function ($edu) use (&$seenLevels) {
            $level = $edu['level'] ?? '';
            if (in_array($level, $seenLevels)) return false;
            $seenLevels[] = $level;
            return true;
        })->values()->toArray();
        $template->educations     = $cleaned;
        $template->intake_options = [
            'Winter Semester 2025/26',
            'Summer Semester 2026',
            'Winter Semester 2026/27',
            'Summer Semester 2027',
        ];
        $template->save();

        // ── 2. Fix group label spelling + add box names & fields ────────────
        $fixes = [
            'LATEST AND HIGST EDUCATIONS'  => ['label' => 'Latest & Highest Education',  'box' => 'Education History',  'fields' => self::educationFields()],
            'LATEST AND HIGHEST EDUCATIONS' => ['label' => 'Latest & Highest Education',  'box' => 'Education History',  'fields' => self::educationFields()],
            'Family Baground'               => ['label' => 'Family Background',            'box' => 'Family Details',     'fields' => self::familyFields()],
            'Sponcoer info'                 => ['label' => 'Sponsor Information',          'box' => 'Sponsor Details',    'fields' => self::sponsorFields()],
            'Sponcoor info'                 => ['label' => 'Sponsor Information',          'box' => 'Sponsor Details',    'fields' => self::sponsorFields()],
        ];

        foreach (FormFieldGroup::where('form_template_id', 48)->get() as $group) {
            $trimmed = trim($group->label ?? '');
            if (! isset($fixes[$trimmed])) continue;

            $fix = $fixes[$trimmed];
            $group->label = $fix['label'];
            $group->save();

            // Get or fix the first box in this group
            $box = $group->boxes()->first();
            if (! $box) {
                $box = FormFieldBox::create([
                    'form_field_group_id' => $group->id,
                    'name'                => $fix['box'],
                    'is_active'           => true,
                    'sort_order'          => 0,
                ]);
            } else {
                $box->name = $fix['box'];
                $box->save();
            }

            // Only add fields if the box currently has none
            if ($box->fields()->count() > 0) continue;

            foreach ($fix['fields'] as $i => $f) {
                FormTemplateField::create([
                    'form_template_id'    => 48,
                    'form_field_group_id' => $group->id,
                    'form_field_box_id'   => $box->id,
                    'label'               => $f['label'],
                    'field_key'           => \Illuminate\Support\Str::snake($f['label']) . '_' . $box->id . '_' . $i,
                    'field_type'          => $f['type'] ?? 'text',
                    'box_size'            => $f['size'] ?? 'middle',
                    'is_required'         => $f['required'] ?? false,
                    'is_active'           => true,
                    'options'             => $f['options'] ?? null,
                    'placeholder'         => $f['placeholder'] ?? null,
                    'sort_order'          => $i,
                ]);
            }
        }
    }

    public function down(): void {}

    // ── Field definitions ────────────────────────────────────────────────────

    private static function educationFields(): array
    {
        return [
            ['label' => 'Current Institution / University', 'type' => 'text',   'size' => 'full',   'required' => true,  'placeholder' => 'e.g. University of Berlin'],
            ['label' => 'Field of Study / Major',           'type' => 'text',   'size' => 'middle', 'required' => true,  'placeholder' => 'e.g. Computer Science'],
            ['label' => 'Country of Study',                 'type' => 'text',   'size' => 'middle', 'required' => false, 'placeholder' => 'e.g. Bangladesh'],
            ['label' => 'CGPA / Grade',                     'type' => 'text',   'size' => 'small',  'required' => false, 'placeholder' => 'e.g. 3.80 / A+'],
            ['label' => 'Graduation Year',                  'type' => 'number', 'size' => 'small',  'required' => false, 'placeholder' => 'e.g. 2024'],
            ['label' => 'German Language Level',            'type' => 'select', 'size' => 'middle', 'required' => false, 'options' => ['None','A1','A2','B1','B2','C1','C2']],
            ['label' => 'English Language Test',            'type' => 'select', 'size' => 'middle', 'required' => false, 'options' => ['None','IELTS','TOEFL','Duolingo','PTE','Cambridge']],
            ['label' => 'Language Test Score',              'type' => 'text',   'size' => 'small',  'required' => false, 'placeholder' => 'e.g. IELTS 6.5'],
        ];
    }

    private static function familyFields(): array
    {
        return [
            ['label' => "Father's Full Name",    'type' => 'text',     'size' => 'middle', 'required' => false, 'placeholder' => 'Full name'],
            ['label' => "Father's Occupation",   'type' => 'text',     'size' => 'middle', 'required' => false, 'placeholder' => 'e.g. Business'],
            ['label' => "Mother's Full Name",    'type' => 'text',     'size' => 'middle', 'required' => false, 'placeholder' => 'Full name'],
            ['label' => "Mother's Occupation",   'type' => 'text',     'size' => 'middle', 'required' => false, 'placeholder' => 'e.g. Housewife'],
            ['label' => 'Number of Siblings',    'type' => 'number',   'size' => 'small',  'required' => false, 'placeholder' => 'e.g. 2'],
            ['label' => 'Family Monthly Income', 'type' => 'text',     'size' => 'small',  'required' => false, 'placeholder' => 'e.g. 80,000 BDT'],
            ['label' => 'Family Home Address',   'type' => 'textarea', 'size' => 'full',   'required' => false, 'placeholder' => 'Full home address'],
        ];
    }

    private static function sponsorFields(): array
    {
        return [
            ['label' => "Sponsor's Full Name",       'type' => 'text',   'size' => 'middle', 'required' => true,  'placeholder' => 'Full legal name'],
            ['label' => 'Relationship to Applicant', 'type' => 'select', 'size' => 'middle', 'required' => true,  'options' => ['Father','Mother','Brother','Sister','Relative','Self','Other']],
            ['label' => "Sponsor's Occupation",      'type' => 'text',   'size' => 'middle', 'required' => false, 'placeholder' => 'e.g. Engineer'],
            ['label' => "Sponsor's Monthly Income",  'type' => 'text',   'size' => 'small',  'required' => false, 'placeholder' => 'e.g. 150,000 BDT'],
            ['label' => "Sponsor's Contact Number",  'type' => 'tel',    'size' => 'small',  'required' => false, 'placeholder' => '+880...'],
            ['label' => "Sponsor's Address",         'type' => 'textarea','size' => 'full',  'required' => false, 'placeholder' => 'Full address of sponsor'],
        ];
    }
};
