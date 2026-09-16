<?php

namespace App\Filament\Widgets;

use App\Models\Branch;
use App\Models\FundTransfer;
use App\Models\Payment;
use App\Models\Refund;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

/**
 * Answers, per branch, at a glance: how much has this branch ever collected
 * on behalf of Head Office (fund_target = head_office memos), how much of
 * that has Head Office actually confirmed receiving (Mark as Received on a
 * Balance row), and what's still sitting uncollected. Both sides — the
 * branch's own Settlement page shows the same number for just their branch,
 * this shows it for every branch at once on the admin side.
 *
 * Deliberately plain per-branch queries (not one compound withSum/whereHas
 * query across a hasManyThrough) — branch count is small, so three simple,
 * easy-to-verify queries per row beats one clever query that's hard to be
 * sure is actually correct.
 */
class BranchBalanceSummaryWidget extends BaseWidget
{
    protected static ?string $heading = 'Owed to Head Office, by Branch';

    protected int | string | array $columnSpan = 'full';

    /** Memoized per branch for this render — each of the 3 columns below
     *  calls this once via getStateUsing(); without caching that'd be 3
     *  separate query trips per row instead of 1. */
    private array $statsCache = [];

    private function stats(int $branchId): array
    {
        if (isset($this->statsCache[$branchId])) {
            return $this->statsCache[$branchId];
        }

        $collected = (float) Payment::where('branch_id', $branchId)
            ->where('fund_target', 'head_office')
            ->sum('amount');

        $refunded = (float) Refund::approved()
            ->whereHas('payment', fn ($q) => $q->where('branch_id', $branchId)->where('fund_target', 'head_office'))
            ->sum('amount');

        $received = (float) FundTransfer::where('branch_id', $branchId)
            ->where('status', 'received')
            ->sum('amount');

        $net = max($collected - $refunded, 0);

        return $this->statsCache[$branchId] = [
            'collected' => $net,
            'received'  => $received,
            'pending'   => round($net - $received, 2),
        ];
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(Branch::query())
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Branch')
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('collected_for_ho')
                    ->label('Collected for Head Office')
                    ->getStateUsing(fn (Branch $record) => $this->stats($record->id)['collected'])
                    ->money('BDT'),

                Tables\Columns\TextColumn::make('received')
                    ->label('Received')
                    ->getStateUsing(fn (Branch $record) => $this->stats($record->id)['received'])
                    ->money('BDT')
                    ->color('success'),

                // Usually positive (branch still owes HO this much). If a
                // memo gets refunded *after* HO already received that money,
                // this goes negative instead — flagged distinctly, since it
                // now means the reverse: HO owes the branch back.
                Tables\Columns\TextColumn::make('pending')
                    ->label('Pending / Owed Back')
                    ->getStateUsing(fn (Branch $record) => $this->stats($record->id)['pending'])
                    ->formatStateUsing(fn ($state) => $state < 0
                        ? 'HO owes ' . number_format(abs($state), 2)
                        : number_format($state, 2))
                    ->badge()
                    ->color(fn ($state) => $state > 0 ? 'danger' : ($state < 0 ? 'warning' : 'success')),
            ])
            ->paginated(false)
            ->emptyStateHeading('No branches yet');
    }
}
