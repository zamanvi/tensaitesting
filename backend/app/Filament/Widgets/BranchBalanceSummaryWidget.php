<?php

namespace App\Filament\Widgets;

use App\Models\Branch;
use App\Models\FundTransfer;
use App\Models\Payment;
use App\Models\Refund;
use Filament\Forms;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

/**
 * Answers, per branch, at a glance: how much has this branch kept for
 * itself (Branch Fund memos), how much has it collected on behalf of Head
 * Office (fund_target = head_office memos), how much of that HO has
 * actually confirmed receiving, and what's still sitting uncollected.
 * Main Branch (Head Office collecting directly) is intentionally not a row
 * here — see BalanceOverviewWidget above, which covers it separately,
 * since "pending transfer to itself" isn't a meaningful concept.
 *
 * Deliberately plain per-branch queries (not one compound withSum/whereHas
 * query across a hasManyThrough) — branch count is small, so several
 * simple, easy-to-verify queries per row beats one clever query that's
 * hard to be sure is actually correct.
 */
class BranchBalanceSummaryWidget extends BaseWidget
{
    // Filament lazy-loads widgets by default (blank placeholder first,
    // then a follow-up Livewire request fills it in). That follow-up
    // request was failing silently in production with no visible error —
    // rendering eagerly, in the initial page response, sidesteps it.
    protected static bool $isLazy = false;

    protected static ?string $heading = 'Owed to Head Office, by Branch';

    protected int | string | array $columnSpan = 'full';

    // Read by stats() below; set via the date filter's query() callback —
    // Filament runs every active filter's query() before the table's rows
    // are fetched, so by the time columns render these are already current.
    public ?string $filterFrom = null;
    public ?string $filterUntil = null;

    /** Memoized per (branch, date range) for this render — each column
     *  calls this once via getStateUsing(); without caching that'd be
     *  several separate query trips per row instead of one. */
    private array $statsCache = [];

    private function stats(int $branchId): array
    {
        $key = $branchId . '|' . $this->filterFrom . '|' . $this->filterUntil;
        if (isset($this->statsCache[$key])) {
            return $this->statsCache[$key];
        }

        $paymentsBase = fn () => Payment::where('branch_id', $branchId)
            ->when($this->filterFrom, fn ($q) => $q->whereDate('created_at', '>=', $this->filterFrom))
            ->when($this->filterUntil, fn ($q) => $q->whereDate('created_at', '<=', $this->filterUntil));

        $collectedHo  = (float) $paymentsBase()->where('fund_target', 'head_office')->sum('amount');
        $keptByBranch = (float) $paymentsBase()->where('fund_target', 'branch')->sum('amount');

        $refundsFor = fn (string $fundTarget) => Refund::approved()
            ->whereHas('payment', fn ($q) => $q->where('branch_id', $branchId)->where('fund_target', $fundTarget))
            ->when($this->filterFrom, fn ($q) => $q->whereDate('refunds.created_at', '>=', $this->filterFrom))
            ->when($this->filterUntil, fn ($q) => $q->whereDate('refunds.created_at', '<=', $this->filterUntil));

        $hoRefunded     = (float) $refundsFor('head_office')->sum('amount');
        $branchRefunded = (float) $refundsFor('branch')->sum('amount');

        $received = (float) FundTransfer::where('branch_id', $branchId)
            ->where('status', 'received')
            ->when($this->filterFrom, fn ($q) => $q->whereDate('created_at', '>=', $this->filterFrom))
            ->when($this->filterUntil, fn ($q) => $q->whereDate('created_at', '<=', $this->filterUntil))
            ->sum('amount');

        $netHo   = max($collectedHo - $hoRefunded, 0);
        $netKept = max($keptByBranch - $branchRefunded, 0);

        return $this->statsCache[$key] = [
            'kept'      => $netKept,
            'collected' => $netHo,
            'received'  => $received,
            'pending'   => round($netHo - $received, 2),
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

                Tables\Columns\TextColumn::make('kept_by_branch')
                    ->label('Kept by Branch')
                    ->getStateUsing(fn (Branch $record) => $this->stats($record->id)['kept'])
                    ->money('BDT')
                    ->color('gray'),

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
            ->filters([
                Tables\Filters\SelectFilter::make('id')
                    ->label('Branch')
                    ->options(fn () => Branch::query()->pluck('name', 'id'))
                    ->query(fn (Builder $query, array $data) => $query->when(
                        $data['value'] ?? null,
                        fn (Builder $q, $value) => $q->where('id', $value)
                    )),

                Tables\Filters\Filter::make('date_range')
                    ->label('Date range')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label('From'),
                        Forms\Components\DatePicker::make('until')->label('Until'),
                    ])
                    ->query(function (Builder $query, array $data) {
                        // No column on `branches` to filter by — the dates
                        // are applied inside stats() instead. Stash them
                        // here so they're set before any row renders.
                        $this->filterFrom  = $data['from'] ?? null;
                        $this->filterUntil = $data['until'] ?? null;
                        return $query;
                    })
                    ->indicateUsing(function (array $data): array {
                        $indicators = [];
                        if ($data['from'] ?? null)  $indicators[] = 'From ' . $data['from'];
                        if ($data['until'] ?? null) $indicators[] = 'Until ' . $data['until'];
                        return $indicators;
                    }),

                Tables\Filters\SelectFilter::make('settlement_status')
                    ->label('Settlement status')
                    ->options([
                        'pending' => 'Pending only',
                        'settled' => 'Fully settled only',
                    ])
                    // `pending` is computed, not a real column, so this
                    // resolves matching branch IDs first, then filters by
                    // that plain, ordinary list — standard query building,
                    // no reliance on framework internals for computed data.
                    ->query(function (Builder $query, array $data) {
                        $status = $data['value'] ?? null;
                        if (blank($status)) {
                            return $query;
                        }
                        $matchingIds = Branch::query()->pluck('id')->filter(
                            fn ($id) => $status === 'pending'
                                ? $this->stats($id)['pending'] > 0
                                : $this->stats($id)['pending'] <= 0
                        );
                        return $query->whereIn('id', $matchingIds);
                    }),
            ])
            ->paginated(false)
            ->emptyStateHeading('No branches yet');
    }
}
