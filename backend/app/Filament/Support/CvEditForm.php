<?php

namespace App\Filament\Support;

use App\Models\CvAccess;
use App\Models\FormTemplate;
use App\Support\CvInterview;
use Filament\Forms;

// The staff "Edit CV" form: one input per Job CV question, in the order the
// person is asked them, plus the English summary. It is built from the same
// form template, so a field staff add to the Job CV form appears here too.
// State keys are prefixed (f_<field_key>) so they never clash with `summary`.
class CvEditForm
{
    public const PREFIX = 'f_';

    public static function schema(CvAccess $access): array
    {
        $application = $access->application;
        $template    = $application ? FormTemplate::find($application->form_template_id) : null;

        $components = [
            Forms\Components\Textarea::make('summary')
                ->label('English summary (Profile)')
                ->helperText('Shown at the top of the CV and on the share link. If you leave it empty, the assistant\'s generated summary is used.')
                ->rows(4)
                ->maxLength(900)
                ->columnSpanFull(),
        ];

        $group = null;
        foreach ($template ? CvInterview::questions($template) : [] as $q) {
            if ($q['group'] !== $group) {
                $group = $q['group'];
                $components[] = Forms\Components\Placeholder::make('h_' . md5($group))
                    ->label($group)
                    ->content('')
                    ->columnSpanFull();
            }

            $name = self::PREFIX . $q['key'];

            $field = match ($q['type']) {
                'select' => Forms\Components\Select::make($name)
                    ->options(array_combine($q['options'], $q['options']))
                    ->native(false),
                'date' => Forms\Components\DatePicker::make($name)
                    ->maxDate(now())
                    ->format('Y-m-d'),
                'textarea' => Forms\Components\Textarea::make($name)
                    ->rows(3)
                    ->maxLength(1000)
                    ->columnSpanFull(),
                'number' => Forms\Components\TextInput::make($name)
                    ->numeric(),
                default => Forms\Components\TextInput::make($name)
                    ->maxLength(200),
            };

            // Not required here: staff must be able to save a CV that is still
            // incomplete (the person fills the rest in). The "required" gate is
            // for the person sending the CV for review, not for staff edits.
            $components[] = $field->label($q['label']);
        }

        return $components;
    }

    // Current values keyed for the form above.
    public static function values(CvAccess $access): array
    {
        $data = $access->application?->form_data ?? [];
        $out  = ['summary' => $access->candidate?->summary];

        $template = $access->application ? FormTemplate::find($access->application->form_template_id) : null;
        foreach ($template ? CvInterview::questions($template) : [] as $q) {
            $out[self::PREFIX . $q['key']] = $data[$q['key']] ?? null;
        }

        return $out;
    }

    // Writes the submitted form back: answers into the application, the
    // summary into the Talent Passport.
    public static function save(CvAccess $access, array $state): void
    {
        $answers = [];
        foreach ($state as $key => $value) {
            if (str_starts_with($key, self::PREFIX)) {
                $answers[substr($key, strlen(self::PREFIX))] = $value;
            }
        }

        CvInterview::adminUpdate($access, $answers);

        $summary = trim((string) ($state['summary'] ?? ''));
        $access->candidate?->update(['summary' => $summary === '' ? null : $summary]);
    }
}
