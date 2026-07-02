<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAgencyAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || (!$user->hasRole('agency') && $user->gateway_type !== 'agency')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        return $next($request);
    }
}
