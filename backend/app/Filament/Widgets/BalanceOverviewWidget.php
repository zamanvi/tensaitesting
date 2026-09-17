<?php

namespace App\Filament\Widgets;

use App\Models\FundTransfer;
use App\Models\Payment;
use App\Models\Refund;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

/**
 * All-time grand totals across every branch, plus what Head Office has
 * collected directly (Main Branch — branch_id null memos, which never need
 * a transfer since HO already holds that money itself). Deliberately not
 * affected by the per-branch table's filters below it — this stays the
 * fixed big-picture view regardless of how that table is filtered.
 */
class BalanceOverviewWidget extends BaseWidget
{
    // Filament lazy-loads widgets by default (blank placeholder first,
    // then a follow-up Livewire request fills it in). That follow-up
    // request was failing silently in production with no visible error —
    // rendering eagerly, in the initial page response, sidesteps it.
    protected static bool $isLazy = false;

    protected function getStats(): array
    {
        $branchCollectedHo = (float) Payment::whereNotNull('branch_id')
            ->where('fund_target', 'head_office')->sum('amount');
        $branchHoRefunded = (float) Refund::approved()
            ->whereHas('payment', fn ($q) => $q->whereNotNull('branch_id')->where('fund_target', 'head_office'))
            ->sum('amount');
        $netBranchCollectedHo = max($branchCollectedHo - $branchHoRefunded, 0);

        $received = (float) FundTransfer::where('status', 'received')->sum('amount');
        $pending = round($netBranchCollectedHo - $received, 2);

        $directHo = (float) Payment::whereNull('branch_id')->sum('amount');
        $directHoRefunded = (float) Refund::approved()
            ->whereHas('payment', fn ($q) => $q->whereNull('branch_id'))
            ->sum('amount');
        $netDirectHo = max($directHo - $directHoRefunded, 0);

        return [
            Stat::make('Collected for HO (via branches)', number_format($netBranchCollectedHo, 2) . ' BDT')
                ->description('All branches, all time')
                ->color('info'),
            Stat::make('Received by Head Office', number_format($received, 2) . ' BDT')
                ->description('Confirmed received transfers')
                ->color('success'),
            Stat::make('Still Pending', number_format($pending, 2) . ' BDT')
                ->description($pending > 0 ? 'Owed to Head Office' : 'All settled')
                ->color($pending > 0 ? 'danger' : 'success'),
            Stat::make('Collected Directly by HO', number_format($netDirectHo, 2) . ' BDT')
                ->description('Main Branch — no transfer needed')
                ->color('gray'),
        ];
    }
}
