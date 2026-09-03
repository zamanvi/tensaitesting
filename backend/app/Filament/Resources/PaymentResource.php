<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PaymentResource\Pages;
use App\Models\Payment;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PaymentResource extends Resource
{
    protected static ?string $model         = Payment::class;
    protected static ?string $navigationIcon  = 'heroicon-o-receipt-percent';
    protected static ?string $navigationGroup = 'Revenue';
    protected static ?string $navigationLabel = 'Memos';
    protected static ?string $modelLabel       = 'Memo';
    protected static ?string $pluralModelLabel = 'Memos';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    // Branch dashboard entry is the only writer — this resource is a
    // head-office audit view, not a place to create or edit ledger entries.
    public static function canCreate(): bool { return false; }
    public static function canEdit($record): bool { return false; }
    public static function canDelete($record): bool { return false; }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['branch', 'category', 'application']);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('receipt_no')
                    ->label('Receipt')
                    ->fontFamily('mono')
                    ->weight('bold')
                    ->searchable()
                    ->description(fn (Payment $r) => $r->created_at?->format('d M Y, H:i')),

                Tables\Columns\TextColumn::make('customer_name')
                    ->label('Customer')
                    ->searchable()
                    ->description(fn (Payment $r) => $r->application?->application_code),

                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->searchable(),

                Tables\Columns\TextColumn::make('category.label')
                    ->label('Category')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('fund_target')
                    ->label('Routes To')
                    ->badge()
                    ->formatStateUsing(fn ($state) => $state === 'branch' ? 'Branch Fund' : 'Head Office Fund')
                    ->color(fn ($state) => $state === 'branch' ? 'success' : 'info'),

                Tables\Columns\TextColumn::make('amount')
                    ->money(fn (Payment $r) => $r->currency)
                    ->sortable(),

                Tables\Columns\TextColumn::make('method')
                    ->badge()
                    ->color('gray')
                    ->formatStateUsing(fn ($state) => ucfirst($state)),
            ])
            ->filters([
                SelectFilter::make('branch_id')
                    ->label('Branch')
                    ->relationship('branch', 'name'),
                SelectFilter::make('payment_category_id')
                    ->label('Category')
                    ->relationship('category', 'label'),
                SelectFilter::make('fund_target')
                    ->options(['branch' => 'Branch Fund', 'head_office' => 'Head Office Fund']),
                Tables\Filters\Filter::make('created_range')
                    ->form([
                        \Filament\Forms\Components\DatePicker::make('from')->native(false),
                        \Filament\Forms\Components\DatePicker::make('until')->native(false),
                    ])
                    ->query(function (Builder $query, array $data) {
                        return $query
                            ->when($data['from'], fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                            ->when($data['until'], fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                    }),
            ])
            ->filtersLayout(Tables\Enums\FiltersLayout::AboveContentCollapsible)
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->emptyStateHeading('No memos yet')
            ->emptyStateDescription('Branch memos will appear here as soon as they are created.')
            ->emptyStateIcon('heroicon-o-receipt-percent');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPayments::route('/'),
            'view'  => Pages\ViewPayment::route('/{record}'),
        ];
    }
}
