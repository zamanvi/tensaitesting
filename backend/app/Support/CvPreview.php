<?php

namespace App\Support;

use App\Models\CvAccess;
use App\Models\FormTemplate;

// The CV as a reader sees it: header, summary, then one section per form group
// with only the answered rows. Built from the same Job CV application the
// person fills in, so the user's preview and the admin's preview are always
// identical. It never contains phone, e-mail, WhatsApp, address or passport.
class CvPreview
{
    public static function build(CvAccess $access): array
    {
        $application = $access->application;
        $data        = $application?->form_data ?? [];

        $template = $application
            ? FormTemplate::with('activeFieldGroups.activeBoxes.activeFields')->find($application->form_template_id)
            : null;

        $sections = [];
        foreach ($template?->activeFieldGroups ?? [] as $group) {
            $items = [];
            foreach ($group->activeBoxes as $box) {
                foreach ($box->activeFields as $field) {
                    if ($field->field_type === 'file') {
                        continue;
                    }
                    $value = $data[$field->field_key] ?? null;
                    if ($value === null || trim((string) $value) === '') {
                        continue;
                    }
                    $items[] = [
                        'key'   => $field->field_key,
                        'label' => $field->label,
                        'value' => (string) $value,
                        'type'  => $field->field_type,
                    ];
                }
            }
            if ($items) {
                $sections[] = ['title' => $group->label, 'items' => $items];
            }
        }

        // Staff text wins over the generated one, so a correction is never
        // overwritten by pressing the assistant button again.
        $summary = trim((string) ($access->candidate?->summary ?? ''))
            ?: trim((string) (($access->chat_log['ai_summary'] ?? '')));

        return [
            'name'     => $application?->student_name,
            'headline' => $data['desired_job'] ?? null,
            'summary'  => $summary !== '' ? $summary : null,
            'sections' => $sections,
            'progress' => (int) ($application?->progress ?? 0),
        ];
    }

    // What the shareable link shows to anyone who holds it. Compared with the
    // owner's preview:
    //   * name is "First L." — contact always goes through staff, using `ref`
    //   * date of birth becomes an age
    //   * "can visit the office" (internal) is left out
    public static function publicVersion(CvAccess $access): array
    {
        $full = self::build($access);

        $sections = [];
        foreach ($full['sections'] as $section) {
            $items = [];
            foreach ($section['items'] as $item) {
                if ($item['key'] === 'can_visit_office') {
                    continue;
                }
                if ($item['key'] === 'date_of_birth') {
                    try {
                        $items[] = [
                            'key'   => 'age',
                            'label' => 'Age / বয়স',
                            'value' => (string) \Carbon\Carbon::parse($item['value'])->age,
                            'type'  => 'text',
                        ];
                    } catch (\Throwable) {
                        // An unreadable date is simply not shown.
                    }
                    continue;
                }
                $items[] = $item;
            }
            if ($items) {
                $sections[] = ['title' => $section['title'], 'items' => $items];
            }
        }

        return [
            'ref'      => $access->candidate?->code,
            'name'     => self::shortName($full['name']),
            'headline' => $full['headline'],
            'summary'  => $full['summary'],
            'sections' => $sections,
        ];
    }

    private static function shortName(?string $name): ?string
    {
        $parts = preg_split('/\s+/u', trim((string) $name), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if (count($parts) < 2) {
            return $parts[0] ?? null;
        }

        return $parts[0] . ' ' . mb_substr(end($parts), 0, 1) . '.';
    }
}
