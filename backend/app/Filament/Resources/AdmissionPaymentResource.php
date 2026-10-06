<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AdmissionPaymentResource\Pages;
use App\Models\Branch;
use App\Models\Payment;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * A read-only, one-row-per-student rollup of the same Memo (Payment) data
 * PaymentResource already manages — not a new data source, no new create/
 * edit flow. "Which students have already paid, and how much" is the whole
 * point, mirrored from Payment::ledgerForStudent(), the exact same
 * refund-aware total the "Student Total" modal on Memos already uses, so
 * the numbers here can never drift from what Memos itself shows.
 */
class AdmissionPaymentResource extends Resource
{
    protected static ?string $model         = Payment::class;
    protected static ?string $navigationIcon  = 'heroicon-o-academic-cap';
    protected static ?string $navigationGroup = 'Revenue';
    // Labels only — the class name (and so the URL /admin/admission-payments and
    // the per-manager access list, which is stored by class) is deliberately
    // unchanged. Each row is one student's total across all their memos, not
    // just an admission fee, hence "Student Payments".
    protected static ?string $navigationLabel = 'Student Payments';
    protected static ?string $modelLabel       = 'Student Payment';
    protected static ?string $pluralModelLabel = 'Student Payments';
    protected static ?int    $navigationSort  = 2;

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    public static function canCreate(): bool { return false; }
    public static function canEdit($record): bool { return false; }
    public static function canDelete($record): bool { return false; }

    // One row per (branch, student_roll) pair — the same grouping
    // PaymentResource's own "Student Total" action already uses. Only the
    // identity/searchable columns are selected here; the money figures
    // (total paid/due, memo list) are computed per-row via
    // ledgerFor(), which reuses Payment::ledgerForStudent() so refunds are
    // accounted for exactly the way Memos itself accounts for them.
    public static function getEloquentQuery(): Builder
    {
        return Payment::query()
            ->select([
                DB::raw('MIN(id) as id'),
                'branch_id',
                'student_roll',
                DB::raw('MAX(customer_name) as customer_name'),
                DB::raw('MAX(admission_batch) as admission_batch'),
                DB::raw('MAX(admission_date) as admission_date'),
                DB::raw('MAX(payment_date) as last_payment_date'),
            ])
            ->whereNotNull('student_roll')
            ->where('student_roll', '!=', '')
            ->with('branch')
            ->groupBy('branch_id', 'student_roll');
    }

    // Computed once per (branch, roll) and reused across every column that
    // needs it — ledgerForStudent() is a real query, and without this a
    // page of 15 students would otherwise run it 3-4x per row.
    private static array $ledgerCache = [];

    private static function ledgerFor(Payment $record): array
    {
        $key = ($record->branch_id ?? 'null') . ':' . $record->student_roll;

        return self::$ledgerCache[$key] ??= Payment::ledgerForStudent($record->branch_id, $record->student_roll);
    }

    // Invoiced minus everything the student paid in (gross of refunds), never below 0.
    private static function dueFor(Payment $record): float
    {
        $ledger = self::ledgerFor($record);

        return max(round($ledger['total_invoiced'] - (float) $ledger['memos']->sum('amount'), 2), 0);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('last_payment_date', 'desc')
            ->columns([
                // Every distinct name used on this roll's memos, not just one of them — if two
                // different people ever got the same roll, both names show instead of one
                // silently hiding the other.
                Tables\Columns\TextColumn::make('customer_name')
                    ->label('Student')
                    ->getStateUsing(fn (Payment $record) => self::ledgerFor($record)['memos']
                        ->pluck('customer_name')
                        ->map(fn ($n) => trim((string) $n))
                        ->filter()
                        ->unique(fn ($n) => mb_strtolower($n))
                        ->implode(' / '))
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('student_roll')
                    ->label('Roll')
                    ->searchable()
                    ->fontFamily('mono'),

                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->placeholder('Main Branch'),

                Tables\Columns\TextColumn::make('admission_batch')
                    ->label('Batch')
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('admission_date')
                    ->label('Admission Date')
                    ->date('d M Y')
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('total_paid')
                    ->label('Total Paid')
                    ->getStateUsing(fn (Payment $record) => self::ledgerFor($record)['total_paid'])
                    ->money('BDT')
                    ->weight('bold')
                    ->color('success'),

                // Money handed back is not money still owed: Due is measured against what the
                // student actually paid in (before refunds), and refunds get their own column.
                // Previously a refund pushed a fully-paid student back to "Partial".
                Tables\Columns\TextColumn::make('total_due')
                    ->label('Due')
                    ->getStateUsing(fn (Payment $record) => self::dueFor($record))
                    ->money('BDT')
                    ->color(fn ($state) => $state > 0 ? 'danger' : 'gray'),

                Tables\Columns\TextColumn::make('total_refunded')
                    ->label('Refunded')
                    ->getStateUsing(fn (Payment $record) => self::ledgerFor($record)['total_refunded'] ?: null)
                    ->money('BDT')
                    ->placeholder('—')
                    ->color('danger'),

                Tables\Columns\TextColumn::make('status')
                    ->label('Status')
                    ->getStateUsing(fn (Payment $record) => self::dueFor($record) > 0 ? 'Partial' : 'Fully Paid')
                    ->badge()
                    ->color(fn ($state) => $state === 'Fully Paid' ? 'success' : 'warning'),

                // An array state, not a joined string — Filament renders
                // each array item on its own line via listWithLineBreaks()
                // (plain "\n" inside one string would just collapse to a
                // space in HTML, same lesson learned from the
                // manager_sections column elsewhere).
                Tables\Columns\TextColumn::make('memos')
                    ->label('Memos')
                    ->getStateUsing(fn (Payment $record) => self::ledgerFor($record)['memos']
                        ->map(fn (Payment $m) => sprintf(
                            '%s · %s · %s',
                            $m->receipt_no,
                            ($m->payment_date ?? $m->created_at)->format('d M Y'),
                            number_format((float) $m->amount, 0)
                        ))
                        ->all())
                    ->listWithLineBreaks()
                    ->wrap(),

                Tables\Columns\TextColumn::make('last_payment_date')
                    ->label('Last Payment')
                    ->date('d M Y')
                    ->sortable(),
            ])
            ->filters([
                // Plain options(), not relationship() — branch_id is a
                // grouped/aggregated column here, not a clean FK Filament's
                // relationship-filter helper can join against. A branch_id
                // of null (the "Main Branch" virtual option) has no filter
                // entry — a rare enough case that searching by name/roll
                // covers it well enough without the null-vs-'' plumbing a
                // dedicated option would need.
                SelectFilter::make('branch_id')
                    ->label('Branch')
                    ->options(fn () => Branch::orderBy('name')->pluck('name', 'id')->all()),
            ])
            ->actions([
                Tables\Actions\Action::make('view_ledger')
                    ->label('View All Memos')
                    ->icon('heroicon-o-user-circle')
                    ->color('gray')
                    ->modalHeading(fn (Payment $record) => "Student Roll {$record->student_roll} — " . ($record->branch?->name ?? 'Main Branch'))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->modalContent(function (Payment $record) {
                        $ledger = self::ledgerFor($record);
                        $currency = $ledger['memos']->first()?->currency ?? 'BDT';
                        return view('filament.modals.student-ledger', ['ledger' => $ledger, 'currency' => $currency]);
                    }),
            ])
            ->emptyStateHeading('No students yet')
            ->emptyStateDescription('Students appear here as soon as they have a memo with a Student Roll.')
            ->emptyStateIcon('heroicon-o-academic-cap');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAdmissionPayments::route('/'),
        ];
    }
}
