<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AnswerLibraryItem;
use App\Models\AnswerLibraryQuestion;
use App\Support\AnswerMatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// The staff-verified Answer Library, as a signed-in student sees it. Everything
// returned here is a VERIFIED, unexpired item (AnswerLibraryItem::servable());
// nothing is generated, so it costs nothing per question.
class StudentFaqController extends Controller
{
    // GET /api/student/faq?lang=bn  — every verified entry, for browsing.
    public function index(Request $request): JsonResponse
    {
        $lang = $this->lang($request);

        $items = AnswerLibraryItem::servable()
            ->orderBy('category')->orderBy('sort_order')->orderBy('id')
            ->get()
            ->map(fn (AnswerLibraryItem $i) => $this->present($i, $lang))
            ->values();

        return response()->json([
            'categories' => collect(AnswerLibraryItem::CATEGORIES)
                ->map(fn ($label, $key) => ['key' => $key, 'label' => $label])
                ->values(),
            'items'      => $items,
        ]);
    }

    // POST /api/student/faq/ask  { question, lang? }
    public function ask(Request $request): JsonResponse
    {
        $data = $request->validate(['question' => 'required|string|min:3|max:300']);
        $lang = $this->lang($request);

        $result = AnswerMatcher::match($data['question']);

        $log = AnswerLibraryQuestion::create([
            'user_id' => $request->user()->id,
            'question' => self::mask($data['question']),
            'lang'     => $lang,
            'item_id'  => $result['item']?->id,
            'outcome'  => $result['outcome'],
            'score'    => $result['score'],
        ]);

        if ($result['item']) {
            $result['item']->increment('times_shown');
        }

        return response()->json([
            'outcome'     => $result['outcome'],
            'question_id' => $log->id,
            'item'        => $result['item'] ? $this->present($result['item'], $lang) : null,
            'suggestions' => $result['suggestions']
                ->map(fn (AnswerLibraryItem $i) => ['id' => $i->id, 'question' => $i->questionFor($lang)])
                ->values(),
        ]);
    }

    // POST /api/student/faq/feedback  { item_id, helpful, question_id? }
    public function feedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'item_id'     => 'required|integer',
            'helpful'     => 'required|boolean',
            'question_id' => 'nullable|integer',
        ]);

        $item = AnswerLibraryItem::servable()->find($data['item_id']);
        if (! $item) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $item->increment($data['helpful'] ? 'helpful_yes' : 'helpful_no');

        if (! empty($data['question_id'])) {
            AnswerLibraryQuestion::where('id', $data['question_id'])
                ->where('user_id', $request->user()->id)
                ->update(['helpful' => $data['helpful']]);
        }

        return response()->json(['ok' => true]);
    }

    private function lang(Request $request): string
    {
        $lang = (string) $request->input('lang', $request->query('lang', 'en'));

        return in_array($lang, ['en', 'bn', 'ja'], true) ? $lang : 'en';
    }

    private function present(AnswerLibraryItem $item, string $lang): array
    {
        return [
            'id'          => $item->id,
            'category'    => $item->category,
            'question'    => $item->questionFor($lang),
            'answer'      => $item->answerFor($lang),
            'source_url'  => $item->source_url,
            'verified_on' => $item->verified_at?->toDateString(),
        ];
    }

    // The text is kept so staff can see what people ask; phone/ID-like digit
    // strings and e-mail addresses are masked first.
    public static function mask(string $text): string
    {
        $text = preg_replace('/[\w.+-]+@[\w-]+\.[\w.-]+/u', '[email]', $text);
        $text = preg_replace('/\p{Nd}[\p{Nd}\s\-]{4,}\p{Nd}/u', '[number]', $text);

        return mb_substr(trim($text), 0, 300);
    }
}
