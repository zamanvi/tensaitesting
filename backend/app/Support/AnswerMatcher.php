<?php

namespace App\Support;

use App\Models\AnswerLibraryItem;
use Illuminate\Support\Collection;

// Finds the verified library answer that a person's question is asking about,
// without any AI: words are compared with the question and the staff-written
// keywords of each verified item.
//
// It is deliberately cautious. A wrong answer is worse than no answer, so:
//   * an answer is returned only when most of the question's words are found in
//     ONE item and no other item is nearly as good;
//   * a question with "not / no / না" that the item does not contain is never
//     answered automatically;
//   * otherwise the person gets a short list of likely entries to tap, or is
//     told that staff will answer.
//
// A cheap AI model can later be put behind the same match() call; nothing that
// calls it would change.
class AnswerMatcher
{
    public const OUTCOME_MATCHED   = 'matched';
    public const OUTCOME_SUGGESTED = 'suggested';
    public const OUTCOME_NONE      = 'none';

    private const MIN_COVERAGE     = 0.6;   // share of the question's words found in the item
    private const MIN_MARGIN       = 0.10;  // lead over the second-best item (on the combined rank)
    private const SUGGEST_COVERAGE = 0.34;

    private const STOPWORDS = [
        // English
        'a', 'an', 'the', 'is', 'are', 'am', 'was', 'be', 'do', 'does', 'did', 'i', 'me', 'my', 'we', 'you', 'your',
        'to', 'of', 'in', 'on', 'for', 'and', 'or', 'it', 'this', 'that', 'can', 'will', 'how', 'what', 'which',
        'who', 'when', 'where', 'why', 'if', 'at', 'by', 'with', 'from', 'about', 'please', 'tell', 'need', 'want',
        // Bangla
        'এই', 'এটা', 'এটি', 'ওই', 'সেই', 'কি', 'কী', 'কেন', 'কিভাবে', 'কীভাবে', 'কোন', 'কোনো', 'কত', 'কবে',
        'কোথায়', 'আমি', 'আমার', 'আমাকে', 'আপনি', 'আপনার', 'আমরা', 'তা', 'ও', 'এবং', 'বা', 'জন্য', 'থেকে',
        'হবে', 'হয়', 'হলে', 'করতে', 'করা', 'করব', 'করবো', 'পারি', 'পারবো', 'পারব', 'আছে', 'লাগে', 'লাগবে',
    ];

    private const NEGATIONS = [
        'not', 'no', 'never', 'without', "don't", 'dont', "can't", 'cant', 'cannot', "isn't", "doesn't",
        'না', 'নয়', 'নেই', 'ছাড়া', 'ছাড়াই',
    ];

    // Words a person might write that mean the same thing as a library word.
    // Kept tiny on purpose: staff keywords do most of this work.
    private const BN_SUFFIXES = ['গুলো', 'গুলি', 'ের', 'কে', 'তে', 'টা', 'টি', 'র', 'ে'];

    /**
     * @return array{outcome:string, item:?AnswerLibraryItem, score:float, suggestions:Collection}
     */
    public static function match(string $question, ?Collection $items = null): array
    {
        $items ??= AnswerLibraryItem::servable()->get();

        $q = self::tokens($question);
        if (count($q) === 0 || $items->isEmpty()) {
            return self::result(self::OUTCOME_NONE);
        }

        $hasNegation = self::hasNegation($question);

        $scored = $items->map(function (AnswerLibraryItem $item) use ($q, $hasNegation) {
            $itemTokens = self::tokens(implode(' ', array_filter([$item->question_en, $item->question_bn, $item->keywords])));
            $matched    = array_values(array_intersect($q, $itemTokens));
            $coverage   = count($matched) / count($q);

            // How much of the entry's OWN question the person's words cover. It
            // separates "What is the JFT-Basic test?" from "How do I book the
            // JFT-Basic test?" when both contain the words that were typed.
            $precision = 0.0;
            foreach ([$item->question_en, $item->question_bn] as $own) {
                $ownTokens = $own ? self::tokens($own) : [];
                if ($ownTokens) {
                    $precision = max($precision, count(array_intersect($q, $ownTokens)) / count($ownTokens));
                }
            }

            // A negated question only counts as answered by an item that also
            // carries the negation.
            $negationClash = $hasNegation && ! self::hasNegation(
                implode(' ', array_filter([$item->question_en, $item->question_bn, $item->keywords, $item->answer_en]))
            );

            return [
                'item'     => $item,
                'matched'  => count($matched),
                'coverage' => $coverage,
                'rank'     => 0.7 * $coverage + 0.3 * $precision,
                'clash'    => $negationClash,
            ];
        })->sortByDesc('rank')->values();

        $best   = $scored->first();
        $second = $scored->get(1);

        // At least two of the person's words must be found: a single shared
        // word ("documents") is far too weak to give a confident answer.
        $enough = $best['matched'] >= 2;
        $clear  = $best['coverage'] >= self::MIN_COVERAGE
            && $enough
            && ! $best['clash']
            && ($second === null || ($best['rank'] - $second['rank']) >= self::MIN_MARGIN);

        if ($clear) {
            return self::result(self::OUTCOME_MATCHED, $best['item'], $best['coverage']);
        }

        $suggestions = $scored
            ->filter(fn ($s) => $s['matched'] >= 1 && $s['coverage'] >= self::SUGGEST_COVERAGE)
            ->take(3)
            ->map(fn ($s) => $s['item'])
            ->values();

        return $suggestions->isEmpty()
            ? self::result(self::OUTCOME_NONE, null, (float) $best['coverage'])
            : self::result(self::OUTCOME_SUGGESTED, null, (float) $best['coverage'], $suggestions);
    }

    private static function result(string $outcome, ?AnswerLibraryItem $item = null, float $score = 0.0, ?Collection $suggestions = null): array
    {
        return [
            'outcome'     => $outcome,
            'item'        => $item,
            'score'       => round($score, 2),
            'suggestions' => $suggestions ?? collect(),
        ];
    }

    private static function hasNegation(string $text): bool
    {
        $words = preg_split('/[^\p{L}\p{M}\p{N}\']+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return (bool) array_intersect($words, self::NEGATIONS);
    }

    // Lower-case words, without stop-words and negations, with light suffix
    // stripping so "tests" matches "test" and "পরীক্ষার" matches "পরীক্ষা".
    public static function tokens(string $text): array
    {
        $words = preg_split('/[^\p{L}\p{M}\p{N}]+/u', mb_strtolower(self::normalize($text)), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $out = [];
        foreach ($words as $w) {
            if (in_array($w, self::STOPWORDS, true) || in_array($w, self::NEGATIONS, true)) {
                continue;
            }
            $out[] = self::stem($w);
        }

        return array_values(array_unique(array_filter($out, fn ($w) => mb_strlen($w) >= 2 || preg_match('/\p{N}/u', $w))));
    }

    // Unicode composition, so the same Bangla word typed two ways compares equal.
    private static function normalize(string $text): string
    {
        if (class_exists(\Normalizer::class)) {
            $n = \Normalizer::normalize($text, \Normalizer::FORM_C);

            return $n === false ? $text : $n;
        }

        return $text;
    }

    private static function stem(string $w): string
    {
        if (preg_match('/^[a-z0-9]+$/', $w)) {
            return (mb_strlen($w) > 3 && str_ends_with($w, 's') && ! str_ends_with($w, 'ss')) ? mb_substr($w, 0, -1) : $w;
        }

        foreach (self::BN_SUFFIXES as $suffix) {
            if (mb_strlen($w) > mb_strlen($suffix) + 2 && str_ends_with($w, $suffix)) {
                return mb_substr($w, 0, mb_strlen($w) - mb_strlen($suffix));
            }
        }

        return $w;
    }
}
