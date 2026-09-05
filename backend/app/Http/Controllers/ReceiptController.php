<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\View\View;

class ReceiptController extends Controller
{
    // Reached only via a signed URL (see routes/web.php) — no session/token
    // auth needed, which is what lets both the Filament admin panel and the
    // branch dashboard (a separate frontend, Bearer-token authenticated,
    // that can't carry that token into a plain browser tab) open the same
    // printable receipt. The signature itself is the authorization, and it
    // expires (see wherever temporarySignedRoute() is called).
    public function show(Payment $payment): View
    {
        return view('receipts.print', [
            'payment' => $payment->load(['branch', 'category', 'application', 'formTemplate']),
        ]);
    }
}
