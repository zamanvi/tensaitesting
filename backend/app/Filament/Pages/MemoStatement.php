<?php

namespace App\Filament\Pages;

use App\Models\Branch;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Pages\Page;
use Illuminate\Support\Facades\URL;

/**
 * A printable, bank-statement-style report of every memo in a date range —
 * what the CEO gets handed at month-end (or whenever), instead of the
 * per-memo "Receipt" print that already exists for a single transaction.
 * Just picks a period (and optionally one branch) here; the actual report
 * renders in a new tab via a signed URL (see StatementController), the
 * same pattern the receipt print already uses.
 */
class MemoStatement extends Page
{
    protected static ?string $navigationIcon  = 'heroicon-o-document-chart-bar';
    protected static ?string $navigationLabel = 'Statement';
    protected static ?string $navigationGroup = 'Revenue';
    protected static ?int    $navigationSort  = 2;
    protected static string  $view            = 'filament.pages.memo-statement';

    // Out of the sidebar — reached instead via the "Statement" button on
    // the Memos list page (see ListPayments::getHeaderActions()), the same
    // way Memo Categories is tucked behind a button rather than its own
    // nav item. It's a report generated from Memo data, not an independent
    // section, so it doesn't need its own sidebar row.
    protected static bool $shouldRegisterNavigation = false;

    // Not independently grantable (see ManagerResource::discoverSectionOptions())
    // — this is a report generated purely from Memo data, so it rides on
    // whatever access to Memos (PaymentResource) the manager already has,
    // rather than needing its own separate checkbox.
    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(\App\Filament\Resources\PaymentResource::class);
    }

    public ?string $from     = null;
    public ?string $until    = null;
    public ?int    $branchId = null;

    // Second, separate form on this same page — a per-student printout
    // (memo no., date, amount) instead of a whole period. Plain Livewire-
    // bound properties rather than a second Filament form component, to
    // keep two independent forms on one page simple.
    public ?int   $studentBranchId = null;
    public string $roll            = '';

    // Third form — one row per student (roll, name, memo count, total
    // paid) for a whole branch, instead of one student's own memo-by-memo
    // detail. Optional date range narrows it to "students who paid in
    // September", say.
    public ?int    $rosterBranchId = null;
    public ?string $rosterFrom     = null;
    public ?string $rosterUntil    = null;

    public function mount(): void
    {
        $this->from  = now()->startOfMonth()->toDateString();
        $this->until = now()->toDateString();
    }

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\DatePicker::make('from')->label('From')->required(),
            Forms\Components\DatePicker::make('until')->label('Until')->required(),
            Forms\Components\Select::make('branchId')
                ->label('Branch')
                ->placeholder('All Branches')
                ->options(fn () => Branch::query()->pluck('name', 'id')),
        ])->columns(3);
    }

    public function branches()
    {
        return Branch::query()->orderBy('name')->get(['id', 'name']);
    }

    public function openStatement(): void
    {
        $this->validate([
            'from'  => 'required|date',
            'until' => 'required|date|after_or_equal:from',
        ]);

        $url = URL::temporarySignedRoute('statements.memos', now()->addMinutes(30), [
            'from'      => $this->from,
            'until'     => $this->until,
            'branch_id' => $this->branchId,
        ]);

        $this->dispatch('open-statement', url: $url);
    }

    public function openStudentStatement(): void
    {
        $this->validate([
            'studentBranchId' => 'required|integer|exists:branches,id',
            'roll'            => 'required|string|max:50',
        ]);

        $url = URL::temporarySignedRoute('statements.student', now()->addMinutes(30), [
            'branch_id' => $this->studentBranchId,
            'roll'      => $this->roll,
        ]);

        $this->dispatch('open-statement', url: $url);
    }

    public function openRosterStatement(): void
    {
        $this->validate([
            'rosterBranchId' => 'required|integer|exists:branches,id',
            'rosterFrom'     => 'nullable|date',
            'rosterUntil'    => 'nullable|date|after_or_equal:rosterFrom',
        ]);

        $url = URL::temporarySignedRoute('statements.roster', now()->addMinutes(30), [
            'branch_id' => $this->rosterBranchId,
            'from'      => $this->rosterFrom,
            'until'     => $this->rosterUntil,
        ]);

        $this->dispatch('open-statement', url: $url);
    }
}
