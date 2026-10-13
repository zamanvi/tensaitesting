<?php

namespace App\Support;

use App\Models\CvAccess;
use App\Models\MobilityCandidate;
use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

// Builds the text staff copy into an AI chat when they search for job circulars
// for one or several candidates: the standing instructions followed by the
// candidates' CVs.
//
// What goes into the pack is the same limited view the shareable CV link uses:
// a short name ("Rahim U."), the reference code and an age, never a phone number,
// e-mail, address, date of birth or passport. Nothing is sent anywhere from here;
// staff paste it themselves, and the job leads they find go back into the
// candidate's internal notes.
class JobSearchPack
{
    public const MAX_CANDIDATES = 15;

    public const DEFAULT_PROMPT = <<<'TXT'
You are helping a consultancy in Bangladesh find REAL, CURRENT job circulars for skilled workers. The candidates are listed after the line "CANDIDATES" (names are shortened and there are no contact details).

For each candidate:
1. Search only these sources: {SITES}
2. Return up to 5 circulars that fit the candidate's job, experience and target country.
3. Present them as a table: job title | employer | country/city | published date | deadline | link | why it fits | red flags.

Rules:
- Use only facts you actually found at the link. Write "unknown" when something is missing. Never invent anything.
- Skip a listing that asks the worker to pay money, has no employer name, or gives only a WhatsApp/Telegram contact; mention it under red flags instead.
- For Japanese Specified Skilled Worker (SSW) jobs, note the required exams (JFT-Basic / JLPT, skills test) if they are stated.
- Do not contact anyone and do not suggest paying anyone.
- If you find nothing reliable for a candidate, say so.
TXT;

    private const NO_SITES = 'official government pages, company career pages and well-known job boards (always give the link)';

    // The instructions, with the staff-edited prompt and site list applied.
    public static function instructions(): string
    {
        $prompt = trim(Setting::get('job_search_prompt', ''));
        if ($prompt === '') {
            $prompt = self::DEFAULT_PROMPT;
        }

        $sites = collect(preg_split('/\R+/', Setting::get('job_search_sites', '')))
            ->map(fn ($s) => trim((string) $s))
            ->filter()
            ->implode(', ');

        return str_replace('{SITES}', $sites !== '' ? $sites : self::NO_SITES, $prompt);
    }

    // Instructions + up to MAX_CANDIDATES candidate blocks.
    public static function build(Collection $candidates): string
    {
        $candidates = $candidates->take(self::MAX_CANDIDATES)->values();

        $blocks = $candidates
            ->map(fn (MobilityCandidate $c, int $i) => self::block($c, $i + 1))
            ->implode("\n\n");

        // Who exported what, by reference code only.
        Log::info('Job search pack generated', [
            'by'   => auth()->id(),
            'refs' => $candidates->pluck('code')->all(),
        ]);

        return self::instructions() . "\n\n---\nCANDIDATES\n\n" . $blocks . "\n";
    }

    private static function block(MobilityCandidate $c, int $n): string
    {
        $access = CvAccess::with(['application', 'candidate'])
            ->where('mobility_candidate_id', $c->id)
            ->first();

        // A finished or in-progress Job CV: use the shareable-link view of it.
        if ($access && $access->application) {
            $cv = CvPreview::publicVersion($access);

            $lines = [
                "Candidate {$n} (Ref: {$c->code})",
                'Name: ' . ($cv['name'] ?: 'unknown'),
            ];
            if (! empty($cv['headline'])) {
                $lines[] = 'Job: ' . $cv['headline'];
            }
            if (! empty($cv['summary'])) {
                $lines[] = 'Summary: ' . $cv['summary'];
            }
            foreach ($cv['sections'] as $section) {
                $lines[] = '[' . self::english($section['title']) . ']';
                foreach ($section['items'] as $item) {
                    $value = $item['type'] === 'select' ? self::english($item['value']) : $item['value'];
                    $lines[] = '- ' . self::english($item['label']) . ': ' . trim(preg_replace('/\s+/', ' ', $value));
                }
            }

            return implode("\n", $lines);
        }

        // A chat lead without a CV yet: only the answers given in the chat.
        $lines = ["Candidate {$n} (Ref: {$c->code})", '(CV not started; answers from the website chat)'];
        foreach ([
            'Job'              => $c->role,
            'Experience'       => $c->experience,
            'Licence'          => $c->licence,
            'Languages'        => $c->languages,
            'Target country'   => $c->target_country,
            'District'         => $c->district,
        ] as $label => $value) {
            if (filled($value)) {
                $lines[] = "- {$label}: {$value}";
            }
        }
        if ($c->has_passport !== null) {
            $lines[] = '- Holds a valid passport: ' . ($c->has_passport ? 'yes' : 'no');
        }

        return implode("\n", $lines);
    }

    // Form labels and choices are stored as "English / বাংলা"; the pack is English.
    private static function english(string $text): string
    {
        return trim(explode(' / ', $text)[0]);
    }
}
