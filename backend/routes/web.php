<?php

use App\Http\Controllers\ReceiptController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return redirect('/admin');
});

Route::get('/admin/form-templates/create', function () {
    return redirect('/admin/form-templates');
});

// Printable receipt — a "Download PDF" button, really: the visitor uses
// their browser's own Print > Save as PDF, no server-side PDF library
// needed. Reachable only via a signed link (no session/token check), so
// both the Filament admin (session-auth) and the branch dashboard (a
// separate frontend on Bearer tokens, which can't carry into a plain new
// tab) can open the same URL — the signature itself is the authorization.
Route::get('/receipts/{payment}', [ReceiptController::class, 'show'])
    ->name('receipts.show')
    ->middleware('signed');
