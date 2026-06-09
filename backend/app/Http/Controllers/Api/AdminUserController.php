<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    /** List all users with optional filters */
    public function index(Request $request): JsonResponse
    {
        $users = User::select('id', 'name', 'email', 'phone', 'gateway_type', 'status', 'affiliate_code', 'created_at')
            ->when($request->gateway_type, fn ($q) => $q->where('gateway_type', $request->gateway_type))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where(function ($sub) use ($request) {
                $sub->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($users);
    }
}
