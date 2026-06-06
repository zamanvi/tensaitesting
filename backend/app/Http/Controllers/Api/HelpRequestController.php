<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HelpRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HelpRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'document_type' => 'nullable|string|max:100',
            'contact_via'   => 'nullable|in:whatsapp,phone',
        ]);

        $user = $request->user();

        // Prevent duplicate pending requests for same doc type
        $existing = HelpRequest::where('user_id', $user->id)
            ->where('document_type', $request->document_type)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'message'    => 'Help request already logged.',
                'request_id' => $existing->id,
                'serial'     => $existing->id,
            ]);
        }

        $help = HelpRequest::create([
            'user_id'       => $user->id,
            'document_type' => $request->document_type,
            'contact_via'   => $request->contact_via ?? 'whatsapp',
            'status'        => 'pending',
        ]);

        return response()->json([
            'message'    => 'Help request logged. Admin will contact you shortly.',
            'request_id' => $help->id,
            'serial'     => $help->id,
        ], 201);
    }

    public function myRequests(Request $request): JsonResponse
    {
        $requests = HelpRequest::where('user_id', $request->user()->id)
            ->latest()
            ->get(['id', 'document_type', 'status', 'contact_via', 'created_at']);

        return response()->json($requests);
    }
}
