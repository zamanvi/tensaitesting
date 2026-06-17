<?php

namespace Database\Seeders;

use App\Models\FormFieldGroup;
use App\Models\FormTemplate;
use App\Models\FormTemplateField;
use Illuminate\Database\Seeder;

class JapanFormTemplateSeeder extends Seeder
{
    public function run(): void
    {
        FormTemplateField::whereHas('template', fn ($q) => $q->where('country', 'Japan'))->delete();
        FormFieldGroup::whereHas('template', fn ($q) => $q->where('country', 'Japan'))->delete();
        FormTemplate::where('country', 'Japan')->delete();

        $template = FormTemplate::create([
            'country'        => 'Japan',
            'name'           => 'Japan Study Abroad Application',
            'is_active'      => true,
            'intake_options' => ['April 2025', 'October 2025', 'April 2026', 'October 2026'],
            'notes'          => 'Standard Japan student visa application form. 5 groups, 24 fields.',
        ]);

        $groups = [
            // ── 1. Personal Information ──────────────────────────────────────
            [
                'label' => 'Personal Information',
                'hint'  => 'Basic personal details as shown in your passport.',
                'fields' => [
                    ['label' => 'Passport Number',        'field_key' => 'passport_number',       'field_type' => 'text',    'box_size' => 'middle', 'is_required' => true,  'requires_document' => true,  'placeholder' => 'e.g. AA1234567',          'helper_text' => 'As printed on your passport'],
                    ['label' => 'Passport Expiry Date',   'field_key' => 'passport_expiry',       'field_type' => 'date',    'box_size' => 'middle', 'is_required' => true,  'requires_document' => false, 'placeholder' => '',                        'helper_text' => 'Must be valid for 6+ months beyond intake'],
                    ['label' => 'Date of Birth',          'field_key' => 'date_of_birth',         'field_type' => 'date',    'box_size' => 'small',  'is_required' => true,  'requires_document' => false, 'placeholder' => '',                        'helper_text' => ''],
                    ['label' => 'Gender',                 'field_key' => 'gender',                'field_type' => 'select',  'box_size' => 'small',  'is_required' => true,  'requires_document' => false, 'placeholder' => '',                        'helper_text' => '',          'options' => ['Male', 'Female', 'Other']],
                    ['label' => 'Nationality',            'field_key' => 'nationality',           'field_type' => 'text',    'box_size' => 'small',  'is_required' => true,  'requires_document' => false, 'placeholder' => 'e.g. Bangladeshi',        'helper_text' => ''],
                    ['label' => 'Religion',               'field_key' => 'religion',              'field_type' => 'select',  'box_size' => 'small',  'is_required' => false, 'requires_document' => false, 'placeholder' => '',                        'helper_text' => '',          'options' => ['Islam', 'Hinduism', 'Buddhism', 'Christianity', 'Other']],
                    ['label' => 'Home Address',           'field_key' => 'home_address',          'field_type' => 'textarea','box_size' => 'full',   'is_required' => true,  'requires_document' => false, 'placeholder' => 'Full address including district and postal code', 'helper_text' => 'Permanent home address'],
                ],
            ],

            // ── 2. Academic Background ───────────────────────────────────────
            [
                'label' => 'Academic Background',
                'hint'  => 'Your educational qualifications and results.',
                'fields' => [
                    ['label' => 'SSC Result (GPA)',       'field_key' => 'ssc_gpa',               'field_type' => 'number',  'box_size' => 'small',  'is_required' => true,  'requires_document' => false, 'placeholder' => 'e.g. 5.00',               'helper_text' => 'Out of 5.00'],
                    ['label' => 'SSC Passing Year',       'field_key' => 'ssc_year',              'field_type' => 'number',  'box_size' => 'small',  'is_required' => true,  'requires_document' => false, 'placeholder' => 'e.g. 2018',               'helper_text' => ''],
                    ['label' => 'HSC / A-Level Result',   'field_key' => 'hsc_gpa',               'field_type' => 'number',  'box_size' => 'small',  'is_required' => true,  'requires_document' => true,  'placeholder' => 'e.g. 4.83',               'helper_text' => 'Out of 5.00'],
                    ['label' => 'HSC Passing Year',       'field_key' => 'hsc_year',              'field_type' => 'number',  'box_size' => 'small',  'is_required' => true,  'requires_document' => false, 'placeholder' => 'e.g. 2020',               'helper_text' => ''],
                    ['label' => 'Highest Qualification',  'field_key' => 'highest_qualification', 'field_type' => 'select',  'box_size' => 'middle', 'is_required' => true,  'requires_document' => false, 'placeholder' => '',                        'helper_text' => '',          'options' => ["SSC / O-Level", "HSC / A-Level", "Diploma", "Bachelor's Degree", "Master's Degree"]],
                    ['label' => 'Degree Subject / Major', 'field_key' => 'degree_subject',        'field_type' => 'text',    'box_size' => 'middle', 'is_required' => false, 'requires_document' => false, 'placeholder' => 'e.g. Computer Science',   'helper_text' => 'If bachelor or above'],
                ],
            ],

            // ── 3. Japanese Language Proficiency ─────────────────────────────
            [
                'label' => 'Japanese Language Proficiency',
                'hint'  => 'JLPT certification and current Japanese language level.',
                'fields' => [
                    ['label' => 'JLPT Level',             'field_key' => 'jlpt_level',            'field_type' => 'select',  'box_size' => 'middle', 'is_required' => true,  'requires_document' => true,  'placeholder' => '',                        'helper_text' => 'Select highest level passed', 'options' => ['None', 'N5', 'N4', 'N3', 'N2', 'N1']],
                    ['label' => 'JLPT Score',             'field_key' => 'jlpt_score',            'field_type' => 'number',  'box_size' => 'small',  'is_required' => false, 'requires_document' => false, 'placeholder' => 'e.g. 106',               'helper_text' => 'Total score on certificate', 'conditional_field_key' => 'jlpt_level', 'conditional_operator' => 'is_not', 'conditional_value' => 'None'],
                    ['label' => 'JLPT Passing Year',      'field_key' => 'jlpt_year',             'field_type' => 'number',  'box_size' => 'small',  'is_required' => false, 'requires_document' => false, 'placeholder' => 'e.g. 2023',              'helper_text' => '',           'conditional_field_key' => 'jlpt_level', 'conditional_operator' => 'is_not', 'conditional_value' => 'None'],
                    ['label' => 'COE Application Status', 'field_key' => 'custom_coe_status',     'field_type' => 'select',  'box_size' => 'middle', 'is_required' => false, 'requires_document' => true,  'placeholder' => '',                        'helper_text' => 'Certificate of Eligibility status', 'options' => ['Not Applied', 'Applied - Awaiting Result', 'Approved', 'Rejected']],
                ],
            ],

            // ── 4. English & Intake Preference ───────────────────────────────
            [
                'label' => 'English Proficiency & Intake',
                'hint'  => 'English test scores if available, and your preferred intake.',
                'fields' => [
                    ['label' => 'English Test Type',      'field_key' => 'english_test',          'field_type' => 'select',  'box_size' => 'small',  'is_required' => false, 'requires_document' => false, 'placeholder' => '',                        'helper_text' => '',          'options' => ['None', 'IELTS', 'TOEFL', 'TOEIC', 'Duolingo', 'Other']],
                    ['label' => 'English Test Score',     'field_key' => 'english_score',         'field_type' => 'text',    'box_size' => 'small',  'is_required' => false, 'requires_document' => false, 'placeholder' => 'e.g. 6.5',               'helper_text' => 'Overall band/score', 'conditional_field_key' => 'english_test', 'conditional_operator' => 'is_not', 'conditional_value' => 'None'],
                    ['label' => 'Desired Course / School','field_key' => 'desired_course',        'field_type' => 'text',    'box_size' => 'full',   'is_required' => false, 'requires_document' => false, 'placeholder' => 'e.g. Japanese Language School in Tokyo', 'helper_text' => 'Preferred school or course if known'],
                    ['label' => 'Preferred Intake',       'field_key' => 'preferred_intake',      'field_type' => 'select',  'box_size' => 'middle', 'is_required' => true,  'requires_document' => false, 'placeholder' => '',                        'helper_text' => '',          'options' => ['April 2025', 'October 2025', 'April 2026', 'October 2026']],
                ],
            ],

            // ── 5. Sponsor / Financial Information ───────────────────────────
            [
                'label' => 'Sponsor & Financial Information',
                'hint'  => "Japan Embassy requires proof of sponsor's financial capacity.",
                'fields' => [
                    ['label' => 'Sponsor Name',            'field_key' => 'sponsor_name',          'field_type' => 'text',    'box_size' => 'middle', 'is_required' => true,  'requires_document' => false, 'placeholder' => 'Full name',               'helper_text' => ''],
                    ['label' => 'Sponsor Relationship',    'field_key' => 'sponsor_relationship',  'field_type' => 'select',  'box_size' => 'middle', 'is_required' => true,  'requires_document' => false, 'placeholder' => '',                        'helper_text' => '',          'options' => ['Father', 'Mother', 'Sibling', 'Spouse', 'Uncle/Aunt', 'Self', 'Other']],
                    ['label' => 'Sponsor Occupation',      'field_key' => 'sponsor_occupation',    'field_type' => 'text',    'box_size' => 'middle', 'is_required' => true,  'requires_document' => true,  'placeholder' => 'e.g. Business Owner',     'helper_text' => 'Required for visa'],
                    ['label' => 'Sponsor Monthly Income',  'field_key' => 'sponsor_monthly_income','field_type' => 'number',  'box_size' => 'middle', 'is_required' => true,  'requires_document' => true,  'placeholder' => 'Amount in BDT',           'helper_text' => 'Must show sufficient funds for study period'],
                ],
            ],
        ];

        foreach ($groups as $sortGroup => $groupData) {
            $group = FormFieldGroup::create([
                'form_template_id' => $template->id,
                'label'            => $groupData['label'],
                'hint'             => $groupData['hint'],
                'sort_order'       => $sortGroup,
                'is_active'        => true,
            ]);

            foreach ($groupData['fields'] as $sortField => $fieldData) {
                FormTemplateField::create([
                    'form_template_id'      => $template->id,
                    'form_field_group_id'   => $group->id,
                    'field_key'             => $fieldData['field_key'],
                    'label'                 => $fieldData['label'],
                    'field_type'            => $fieldData['field_type'],
                    'box_size'              => $fieldData['box_size'],
                    'is_required'           => $fieldData['is_required'],
                    'requires_document'     => $fieldData['requires_document'],
                    'options'               => $fieldData['options'] ?? null,
                    'placeholder'           => $fieldData['placeholder'] ?? null,
                    'helper_text'           => $fieldData['helper_text'] ?? null,
                    'sort_order'            => $sortField,
                    'is_active'             => true,
                    'conditional_field_key' => $fieldData['conditional_field_key'] ?? null,
                    'conditional_operator'  => $fieldData['conditional_operator'] ?? null,
                    'conditional_value'     => $fieldData['conditional_value'] ?? null,
                ]);
            }
        }

        $total = collect($groups)->sum(fn ($g) => count($g['fields']));
        $this->command->info("Japan form template seeded successfully — {$total} fields in " . count($groups) . " groups.");
    }
}
