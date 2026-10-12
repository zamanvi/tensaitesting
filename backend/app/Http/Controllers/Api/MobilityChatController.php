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
    // New submissions one (hashed) address may create per hour, and across the
    // whole site per hour. Counted from the table itself, so the guard holds
    // even if the cache store behind the route throttle misbehaves.
    private const MAX_NEW_PER_IP_PER_HOUR = 5;
    private const MAX_NEW_SITEWIDE_PER_HOUR = 60;

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
            'has_passport'        => 'nullable|boolean',
            'can_visit_office'    => 'nullable|boolean',
            'district'            => 'nullable|string|max:80',
            'answers'             => 'nullable|array|max:20',
            'answers.*.question'  => 'nullable|string|max:300',
            'answers.*.answer'    => 'nullable|string|max:300',
        ]);

        // A phone number already on file: nothing about that record is changed
        // and its reference code is NOT returned. Otherwise anyone who knew a
        // number could overwrite that person's details and read their code
        // (which will also be the key of their public Talent Passport link).
        // Staff see the record was touched again and handle it at the office.
        $existing = MobilityCandidate::where('phone', $data['phone'])->first();
        if ($existing) {
            $existing->touch();

            return response()->json(['ok' => true, 'reference' => null, 'duplicate' => true]);
        }

        $ipHash = hash_hmac('sha256', (string) $request->ip(), (string) config('app.key'));

        $recent = MobilityCandidate::withTrashed()->where('created_at', '>=', now()->subHour());
        if ((clone $recent)->where('ip_hash', $ipHash)->count() >= self::MAX_NEW_PER_IP_PER_HOUR
            || (clone $recent)->where('source', 'chat')->count() >= self::MAX_NEW_SITEWIDE_PER_HOUR) {
            return response()->json(['message' => 'Too many submissions. Please try again later.'], 429);
        }

        $candidate = MobilityCandidate::create([
            'phone'            => $data['phone'],
            'source'           => 'chat',
            'status'           => 'new',
            'lang'             => $data['lang'] ?? null,
            'full_name'        => trim($data['full_name']),
            'role'             => $data['role'] ?? null,
            'experience'       => $data['experience'] ?? null,
            'licence'          => $data['licence'] ?? null,
            'languages'        => $data['languages'] ?? null,
            'target_country'   => $data['target_country'] ?? null,
            'has_passport'     => $data['has_passport'] ?? null,
            'can_visit_office' => $data['can_visit_office'] ?? null,
            'district'         => isset($data['district']) ? trim($data['district']) : null,
            'answers'          => collect($data['answers'] ?? [])
                ->map(fn ($a) => [
                    'question' => trim((string) ($a['question'] ?? '')),
                    'answer'   => trim((string) ($a['answer'] ?? '')),
                ])
                ->values()
                ->all(),
            'phone_consent'    => true,
            'consented_at'     => now(),
            // Only a keyed hash, so repeat abuse can be spotted without the
            // raw address ever being stored.
            'ip_hash'          => $ipHash,
        ]);

        return response()->json(['ok' => true, 'reference' => $candidate->code], 201);
    }
}
