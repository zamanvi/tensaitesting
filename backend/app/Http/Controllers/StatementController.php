<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\View\View;

class StatementController extends Controller
{
    // Reached only via a signed URL (see routes/web.php) — same pattern as
    // the per-memo receipt print, so the link generated inside Filament
    // (session-auth) opens fine in a plain new tab without carrying any
    // auth token into it. The signature is the authorization and expires.
    public function show(Request $request): View
    {
        $from  = $request->date('from') ?? now()->startOfMonth();
        $until = $request->date('until') ?? now();
        $branchId = $request->integer('branch_id') ?: null;

        $payments = Payment::query()
            ->whereDate('created_at', '>=', $from->toDateString())
            ->whereDate('created_at', '<=', $until->toDateString())
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->with(['branch:id,name', 'category:id,label', 'refunds' => fn ($q) => $q->approved()])
            ->oldest()
            ->get();

        $totalCollected = (float) $payments->sum('amount');
        $totalRefunded  = (float) $payments->sum(fn (Payment $p) => (float) $p->refunded_amount);
        $branchFund     = (float) $payments->where('fund_target', 'branch')->sum(fn (Payment $p) => (float) $p->net_amount);
        $headOfficeFund = (float) $payments->where('fund_target', 'head_office')->sum(fn (Payment $p) => (float) $p->net_amount);

        return view('statements.print', [
            'payments'       => $payments,
            'from'           => $from,
            'until'          => $until,
            'branchLabel'    => $branchId ? Branch::find($branchId)?->name : 'All Branches',
            'totalCollected' => $totalCollected,
            'totalRefunded'  => $totalRefunded,
            'netTotal'       => $totalCollected - $totalRefunded,
            'branchFund'     => $branchFund,
            'headOfficeFund' => $headOfficeFund,
        ]);
    }

    // Every memo for one student (branch + roll), regardless of category —
    // the printable counterpart to the on-screen "Student Total" modal.
    public function showStudent(Request $request): View
    {
        $branch = Branch::findOrFail($request->integer('branch_id'));
        $roll   = (string) $request->query('roll');

        $payments = Payment::forStudentRoll($branch->id, $roll)
            ->with(['category:id,label', 'refunds' => fn ($q) => $q->approved()])
            ->oldest()
            ->get();

        return view('statements.student-print', [
            'payments'     => $payments,
            'branch'       => $branch,
            'roll'         => $roll,
            'customerName' => $payments->first()?->customer_name ?? '—',
            'total'        => (float) $payments->sum(fn (Payment $p) => (float) $p->net_amount),
        ]);
    }
}
