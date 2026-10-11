<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MobilityCandidate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Public endpoint behind the Skilled Worker Mobility chat on /mobility.
// Receives the visitor's answers once, at the end of the chat, together with a
// name, a phone number and an explicit consent tick, and stores them as a
// MobilityCandidate for staff to follow up. No account, no token.
class MobilityChatController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Honeypot: a real visitor never sees or fills this field. Answer
        // "ok" so a bot learns nothing, but store nothing.
        if (filled($request->input('website'))) {
            return response()->json(['ok' => true, 'reference' => null]);
        }

        // Compare phone numbers in one shape: digits with an optional leading +.
        if (is_string($request->input('phone'))) {
            $request->merge(['phone' => preg_replace('/[\s\-().]+/', '', $request->input('phone'))]);
        }

        $data = $request->validate([
            'lang'                => 'nullable|in:en,bn,ja',
            'full_name'           => 'required|string|min:2|max:120',
            'phone'               => ['required', 'string', 'regex:/^\+?[0-9]{8,15}$/'],
            'consent'             => 'accepted',
            'role'                => 'nullable|string|max:120',
            'experience'          => 'nullable|string|max:80',
            'licence'             => 'nullable|string|max:160',
            'languages'           => 'nullable|string|max:160',
            'target_country'      => 'nullable|string|max:80',
            'answers'             => 'nullable|array|max:20',
            'answers.*.question'  => 'nullable|string|max:300',
            'answers.*.answer'    => 'nullable|string|max:300',
        ]);

        $fields = [
            'lang'           => $data['lang'] ?? null,
            'full_name'      => trim($data['full_name']),
            'role'           => $data['role'] ?? null,
            'experience'     => $data['experience'] ?? null,
            'licence'        => $data['licence'] ?? null,
            'languages'      => $data['languages'] ?? null,
            'target_country' => $data['target_country'] ?? null,
            'answers'        => collect($data['answers'] ?? [])
                ->map(fn ($a) => [
                    'question' => trim((string) ($a['question'] ?? '')),
                    'answer'   => trim((string) ($a['answer'] ?? '')),
                ])
                ->values()
                ->all(),
            'phone_consent'  => true,
            'consented_at'   => now(),
            // Only a keyed hash, so repeat abuse can be spotted without the
            // raw address ever being stored.
            'ip_hash'        => hash_hmac('sha256', (string) $request->ip(), (string) config('app.key')),
        ];

        // Same phone number again: refresh that record instead of piling up
        // duplicates. Its status (what staff have already done) is kept.
        $existing = MobilityCandidate::where('phone', $data['phone'])->orderByDesc('id')->first();

        if ($existing) {
            // Only overwrite what this submission actually carries, so a later,
            // thinner submission can't blank out answers already on file.
            $existing->update(array_filter(
                $fields,
                fn ($value) => $value !== null && $value !== [] && $value !== ''
            ));

            return response()->json(['ok' => true, 'reference' => $existing->code]);
        }

        $candidate = MobilityCandidate::create($fields + [
            'phone'  => $data['phone'],
            'source' => 'chat',
            'status' => 'new',
        ]);

        return response()->json(['ok' => true, 'reference' => $candidate->code], 201);
    }
}
