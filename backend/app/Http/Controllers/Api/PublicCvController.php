<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CvAccess;
use App\Support\CvPreview;
use Illuminate\Http\JsonResponse;

// The shareable CV link. It answers only while staff have switched the link on,
// the person has given their consent, and My CV is active; in every other case
// (wrong token, link off, paused, no consent) the answer is the same 404, so a
// token cannot be probed for. Never cached, never indexed.
class PublicCvController extends Controller
{
    // GET /api/public/cv/{token}
    public function show(string $token): JsonResponse
    {
        $headers = ['Cache-Control' => 'no-store, max-age=0', 'X-Robots-Tag' => 'noindex, nofollow'];

        if (! preg_match('/^[A-Za-z0-9]{32}$/', $token)) {
            return response()->json(['message' => 'Not found.'], 404, $headers);
        }

        $access = CvAccess::with(['application', 'candidate'])
            ->where('public_token', $token)
            ->first();

        if (! $access || ! $access->publicLinkIsLive()) {
            return response()->json(['message' => 'Not found.'], 404, $headers);
        }

        return response()->json(CvPreview::publicVersion($access), 200, $headers);
    }
}
