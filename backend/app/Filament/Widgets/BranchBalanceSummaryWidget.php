<?php

namespace App\Filament\Widgets;

use App\Models\Branch;
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
 */
class BranchBalanceSummaryWidget extends BaseWidget
{
    protected static ?string $heading = 'Owed to Head Office, by Branch';

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Branch::query()
                    ->withSum(['payments as collected_for_ho' => fn ($q) => $q->where('fund_target', 'head_office')], 'amount')
                    ->withSum(['fundTransfers as received' => fn ($q) => $q->where('status', 'received')], 'amount')
                    // Approved refunds on a Head Office memo are money that
                    // never really stayed HO's — nets straight out of what
                    // was ever "collected for HO" in the first place.
                    ->withSum(['refunds as ho_refunded' => fn ($q) => $q
                        ->where('status', 'approved')
                        ->whereHas('payment', fn ($p) => $p->where('fund_target', 'head_office'))
                    ], 'amount')
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Branch')
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('collected_for_ho')
                    ->label('Collected for Head Office')
                    ->getStateUsing(fn ($record) => max((float) ($record->collected_for_ho ?? 0) - (float) ($record->ho_refunded ?? 0), 0))
                    ->money('BDT'),

                Tables\Columns\TextColumn::make('received')
                    ->label('Received')
                    ->getStateUsing(fn ($record) => (float) ($record->received ?? 0))
                    ->money('BDT')
                    ->color('success'),

                // Usually positive (branch still owes HO this much). If a
                // memo gets refunded *after* HO already received that money,
                // this goes negative instead — flagged distinctly, since it
                // now means the reverse: HO owes the branch back.
                Tables\Columns\TextColumn::make('pending')
                    ->label('Pending / Owed Back')
                    ->getStateUsing(function ($record) {
                        $net = max((float) ($record->collected_for_ho ?? 0) - (float) ($record->ho_refunded ?? 0), 0);
                        return round($net - (float) ($record->received ?? 0), 2);
                    })
                    ->formatStateUsing(fn ($state) => $state < 0
                        ? 'HO owes ' . number_format(abs($state), 2)
                        : number_format($state, 2))
                    ->badge()
                    ->color(fn ($state) => $state > 0 ? 'danger' : ($state < 0 ? 'warning' : 'success')),
            ])
            // 'pending' is computed in PHP (getStateUsing), not a real query
            // column, so it can't be the sort target — sort by the closest
            // real aggregate column instead.
            ->defaultSort('collected_for_ho', 'desc')
            ->paginated(false)
            ->emptyStateHeading('No branches yet');
    }
}
