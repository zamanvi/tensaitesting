<?php

namespace App\Support;

use App\Models\CvAccess;
use App\Models\FormTemplate;
use Illuminate\Validation\ValidationException;

// The step-by-step questions of My CV. There is no language model in this
// part: the next question is simply the next unanswered field of the Job CV
// form, so it is free, fast and always on topic. Answers go straight into the
// Application's form_data, which is what staff see and edit.
class CvInterview
{
    // Questions in form order (group → box → field), without file uploads.
    public static function questions(FormTemplate $template): array
    {
        $template->loadMissing('activeFieldGroups.activeBoxes.activeFields');

        $out = [];
        foreach ($template->activeFieldGroups as $group) {
            foreach ($group->activeBoxes as $box) {
                foreach ($box->activeFields as $field) {
                    if ($field->field_type === 'file') {
                        continue;
                    }
                    $out[] = [
                        'key'         => $field->field_key,
                        'label'       => $field->label,
                        'type'        => $field->field_type,
                        'options'     => $field->options ?? [],
                        'required'    => (bool) $field->is_required,
                        'placeholder' => $field->placeholder,
                        'hint'        => $field->helper_text,
                        'group'       => $group->label,
                    ];
                }
            }
        }

        return $out;
    }

    // The next question to ask, plus counters for the progress line.
    public static function state(CvAccess $access): array
    {
        $application = $access->application;
        $template    = $application ? FormTemplate::find($application->form_template_id) : null;

        if (! $application || ! $template) {
            return ['question' => null, 'answered' => 0, 'total' => 0, 'skipped' => []];
        }

        $data    = $application->form_data ?? [];
        $skipped = $access->chat_log['skipped'] ?? [];
        $all     = self::questions($template);

        $answered = 0;
        $next     = null;
        foreach ($all as $q) {
            $has = isset($data[$q['key']]) && trim((string) $data[$q['key']]) !== '';
            if ($has) {
                $answered++;
                continue;
            }
            if ($next === null && ! in_array($q['key'], $skipped, true)) {
                $next = $q;
            }
        }

        return [
            'question' => $next,
            'answered' => $answered,
            'total'    => count($all),
            'skipped'  => $skipped,
        ];
    }

    // Saves one answer. A required question cannot be left empty; an optional
    // one can be skipped (and is then not asked again).
    public static function answer(CvAccess $access, string $key, ?string $raw): void
    {
        $application = $access->application;
        if (! $application || in_array($application->status, ['accepted', 'rejected'], true)) {
            throw ValidationException::withMessages(['field_key' => 'This CV can no longer be edited.']);
        }

        $template = FormTemplate::find($application->form_template_id);
        $question = collect($template ? self::questions($template) : [])->firstWhere('key', $key);
        if (! $question) {
            throw ValidationException::withMessages(['field_key' => 'Unknown question.']);
        }

        $value   = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', (string) $raw));
        $skipped = $access->chat_log['skipped'] ?? [];
        $data    = $application->form_data ?? [];

        if ($value === '') {
            if ($question['required']) {
                throw ValidationException::withMessages(['value' => 'This answer is needed.']);
            }
            $skipped = array_values(array_unique(array_merge($skipped, [$key])));
        } else {
            self::assertValid($question, $value);
            $data[$key] = $value;
            $skipped    = array_values(array_diff($skipped, [$key]));
        }

        $application->form_data = $data;
        $application->progress  = $application->recalculateProgress();
        $application->save();

        $log            = $access->chat_log ?? [];
        $log['skipped'] = $skipped;
        $access->chat_log = $log;
        $access->save();
    }

    private static function assertValid(array $question, string $value): void
    {
        $fail = fn (string $m) => throw ValidationException::withMessages(['value' => $m]);

        switch ($question['type']) {
            case 'select':
                if (! in_array($value, $question['options'], true)) {
                    $fail('Please choose one of the options.');
                }
                break;
            case 'date':
                $d = \DateTime::createFromFormat('Y-m-d', $value);
                if (! $d || $d->format('Y-m-d') !== $value || $d > new \DateTime('today') || (int) $d->format('Y') < 1930) {
                    $fail('Please enter a valid date.');
                }
                break;
            case 'number':
                if (! is_numeric($value) || abs((float) $value) > 1000000) {
                    $fail('Please enter a number.');
                }
                break;
            case 'textarea':
                if (mb_strlen($value) > 1000) {
                    $fail('Please keep this under 1000 characters.');
                }
                break;
            default:
                if (mb_strlen($value) > 200) {
                    $fail('Please keep this under 200 characters.');
                }
        }
    }
}
