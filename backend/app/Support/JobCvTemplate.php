<?php

namespace App\Support;

use App\Models\FormFieldBox;
use App\Models\FormFieldGroup;
use App\Models\FormTemplate;
use App\Models\FormTemplateField;

// The "Job CV" form: the same Application / FormTemplate machinery the study
// applications use, so the CV appears in "All Applications", has a progress
// bar, and can be edited with the existing form renderer.
//
// ensure() is idempotent and never overwrites staff edits: the template is
// found by name, and its groups/boxes/fields are seeded only while the
// template has none. It is created as a DRAFT so it is not offered to
// students in the "new application" country list (GET /form-templates lists
// published ones only; GET /form-templates/{id} still serves it by id).
class JobCvTemplate
{
    public const COUNTRY = 'Job CV';

    public static function ensure(): FormTemplate
    {
        $template = FormTemplate::firstOrCreate(
            ['country' => self::COUNTRY, 'visa_type' => 'Job CV', 'name' => 'Job CV'],
            ['is_active' => true, 'status' => 'draft', 'notes' => 'Created by the Skilled Worker Mobility CV feature.']
        );

        if (! $template->fieldGroups()->exists()) {
            self::seed($template);
        }

        return $template;
    }

    private static function seed(FormTemplate $template): void
    {
        $yesNo = ['Yes / হ্যাঁ', 'No / না'];

        // [group label, [[box name, [[field_key, label, type, required, options?], ...]], ...]]
        $structure = [
            ['About you / আপনার পরিচিতি', [
                ['Basic details / সাধারণ তথ্য', [
                    ['date_of_birth', 'Date of birth / জন্ম তারিখ', 'date', true],
                    ['gender', 'Gender / লিঙ্গ', 'select', true, ['Male / পুরুষ', 'Female / নারী', 'Other / অন্যান্য']],
                    ['district', 'Home district / জেলা', 'text', true],
                    ['languages', 'Languages you speak / যে ভাষায় কথা বলেন', 'text', false],
                    ['has_passport', 'Do you hold a valid passport? / পাসপোর্ট আছে?', 'select', false, $yesNo],
                ]],
            ]],
            ['Work you do / আপনার কাজ', [
                ['Job / কাজ', [
                    ['desired_job', 'Job title / পদ বা কাজের নাম', 'text', true],
                    ['job_category', 'Type of work / কাজের ধরন', 'select', true, [
                        'Driver / ড্রাইভার', 'Plumber / প্লাম্বার', 'Electrician / ইলেকট্রিশিয়ান',
                        'Welder / ওয়েল্ডার', 'Construction / নির্মাণ', 'Cook or kitchen / রান্না',
                        'Caregiver / কেয়ারগিভার', 'Teacher / শিক্ষক', 'Engineer / ইঞ্জিনিয়ার',
                        'Office or admin / অফিস', 'Factory or machine / ফ্যাক্টরি', 'Other / অন্যান্য',
                    ]],
                    ['target_country', 'Country you would like to work in / যে দেশে কাজ করতে চান', 'text', false],
                ]],
                ['Experience / অভিজ্ঞতা', [
                    ['experience', 'Years of experience / কত বছরের অভিজ্ঞতা', 'text', true],
                    ['work_summary', 'What work have you done? / কী কী কাজ করেছেন', 'textarea', false],
                    ['skills', 'Skills, tools, machines / দক্ষতা ও যন্ত্রপাতি', 'textarea', false],
                ]],
            ]],
            ['Education and licence / শিক্ষা ও লাইসেন্স', [
                ['Education / শিক্ষা', [
                    ['education', 'Highest education / সর্বোচ্চ শিক্ষা', 'select', false, [
                        'Below SSC / এসএসসির নিচে', 'SSC', 'HSC', 'Diploma / ডিপ্লোমা',
                        'Bachelor / স্নাতক', 'Master / স্নাতকোত্তর',
                    ]],
                    ['training', 'Training or certificates / প্রশিক্ষণ বা সনদ', 'textarea', false],
                ]],
                ['Licence / লাইসেন্স', [
                    ['licence_type', 'Licence or trade certificate / লাইসেন্স বা ট্রেড সনদ', 'text', false],
                ]],
            ]],
            ['Availability / প্রস্তুতি', [
                ['Availability / প্রস্তুতি', [
                    ['available_from', 'When can you start? / কবে থেকে কাজ শুরু করতে পারবেন', 'select', false, [
                        'Immediately / এখনই', 'Within 1 month / ১ মাসের মধ্যে', '1 to 3 months / ১-৩ মাসের মধ্যে',
                    ]],
                    ['can_visit_office', 'Can you visit our Dhaka or Pabna office? / অফিসে আসতে পারবেন?', 'select', false, $yesNo],
                ]],
            ]],
        ];

        $groupOrder = 0;
        foreach ($structure as [$groupLabel, $boxes]) {
            $group = FormFieldGroup::create([
                'form_template_id' => $template->id,
                'label'            => $groupLabel,
                'sort_order'       => ++$groupOrder,
                'is_active'        => true,
            ]);

            $boxOrder = 0;
            foreach ($boxes as [$boxName, $fields]) {
                $box = FormFieldBox::create([
                    'form_field_group_id' => $group->id,
                    'name'                => $boxName,
                    'sort_order'          => ++$boxOrder,
                    'is_active'           => true,
                ]);

                $fieldOrder = 0;
                foreach ($fields as $f) {
                    FormTemplateField::create([
                        'form_template_id'    => $template->id,
                        'form_field_group_id' => $group->id,
                        'form_field_box_id'   => $box->id,
                        'field_key'           => $f[0],
                        'label'               => $f[1],
                        'field_type'          => $f[2],
                        'is_required'         => $f[3],
                        'options'             => $f[4] ?? null,
                        'sort_order'          => ++$fieldOrder,
                        'is_active'           => true,
                    ]);
                }
            }
        }
    }
}
