<?php

namespace App\Filament\Pages;

use App\Models\FormTemplate;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Tables;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AllServicesFee extends Page implements HasTable
{
    use InteractsWithTable;

    protected static ?string $navigationIcon  = 'heroicon-o-banknotes';
    protected static ?string $navigationLabel = 'All Services Fee';
    protected static ?string $navigationGroup = 'Revenue';
    protected static ?int    $navigationSort  = 5;
    protected static string  $view            = 'filament.pages.all-services-fee';

    public function getTitle(): string
    {
        return 'All Services Fee';
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(FormTemplate::query()->orderBy('country')->orderBy('name'))
            ->heading('Every application form is a service — set what a direct candidate pays, what an agency pays, and the affiliate cut. Draft/inactive forms are hidden by default (turn off "Live services only" below to see them). The "≈ Affiliate Earns" figure is charged as a real payable commission the moment a referred student\'s application is marked "Live to School" (see the Commissions resource for those).')
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Service')
                    ->searchable()
                    ->weight('bold')
                    ->description(fn (FormTemplate $record) => "{$record->country} · {$record->visa_type}"),

                Tables\Columns\SelectColumn::make('fee_currency')
                    ->label('Currency')
                    ->options([
                        'BDT' => 'BDT', 'JPY' => 'JPY', 'USD' => 'USD',
                        'EUR' => 'EUR', 'KRW' => 'KRW', 'GBP' => 'GBP',
                    ])
                    ->selectablePlaceholder(false),

                Tables\Columns\TextInputColumn::make('direct_fee')
                    ->label('Direct Candidate Fee')
                    ->type('number')
                    ->rules(['nullable', 'numeric', 'min:0'])
                    ->placeholder('0.00'),

                Tables\Columns\TextInputColumn::make('agency_fee')
                    ->label('Agency Fee')
                    ->type('number')
                    ->rules(['nullable', 'numeric', 'min:0'])
                    ->placeholder('0.00'),

                Tables\Columns\SelectColumn::make('affiliate_commission_type')
                    ->label('Affiliate Cut')
                    ->options(['percentage' => '% of direct fee', 'flat' => 'Flat amount'])
                    ->selectablePlaceholder(false),

                Tables\Columns\TextInputColumn::make('affiliate_commission_value')
                    ->label('Commission Value')
                    ->type('number')
                    ->rules(['nullable', 'numeric', 'min:0'])
                    ->placeholder('0.00'),

                Tables\Columns\TextColumn::make('computed_commission')
                    ->label('Affiliate Earns')
                    ->getStateUsing(function (FormTemplate $record) {
                        $amount = $record->affiliateCommissionAmount();
                        return $amount === null ? '—' : number_format($amount, 2) . ' ' . $record->fee_currency;
                    })
                    ->tooltip('Paid to the referring affiliate as a real commission once the referred student\'s application is marked "Live to School".')
                    ->color('success')
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => $state === 'published' ? 'success' : 'gray'),
            ])
            ->filters([
                Tables\Filters\Filter::make('live_only')
                    ->label('Live services only')
                    ->default(true)
                    ->query(fn (Builder $query) => $query->where('status', 'published')->where('is_active', true))
                    ->toggle(),
                Tables\Filters\SelectFilter::make('country')
                    ->options(fn () => FormTemplate::query()->distinct()->pluck('country', 'country')->filter()->toArray()),
            ])
            ->paginated([25, 50, 100]);
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }
}
