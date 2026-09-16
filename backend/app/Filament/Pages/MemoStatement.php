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
    protected static ?int    $navigationSort  = 5;
    protected static string  $view            = 'filament.pages.memo-statement';

    public ?string $from     = null;
    public ?string $until    = null;
    public ?int    $branchId = null;

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
}
