<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CommissionResource\Pages;
use App\Models\Commission;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class CommissionResource extends Resource
{
    protected static ?string $model = Commission::class;
    protected static ?string $navigationIcon = 'heroicon-o-banknotes';
    protected static ?string $navigationGroup = 'Commissions';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Commission Details')->schema([
                Forms\Components\Select::make('lead_id')
                    ->label('Lead')
                    ->relationship('lead', 'lead_code')
                    ->searchable()->required(),
                Forms\Components\Select::make('type')
                    ->options([
                        'platform_service_fee' => 'Platform Service Fee',
                        'institution_commission' => 'Institution Commission',
                        'agency_processing_fee' => 'Agency Processing Fee',
                        'lead_unlock_fee' => 'Lead Unlock Fee',
                        'b2b_profit_share' => 'B2B Profit Share',
                        'affiliate_associate' => 'Affiliate (Associate)',
                        'affiliate_global_partner' => 'Affiliate (Global Partner)',
                        'referral_sourcing_fee' => 'Referral Sourcing Fee',
                    ])->required(),
                Forms\Components\Select::make('payer_id')
                    ->label('Payer')
                    ->relationship('payer', 'name')
                    ->searchable(),
                Forms\Components\Select::make('payee_id')
                    ->label('Payee')
                    ->relationship('payee', 'name')
                    ->searchable(),
            ])->columns(2),

            Forms\Components\Section::make('Amount & Status')->schema([
                Forms\Components\TextInput::make('amount')->numeric()->prefix('BDT')->required(),
                Forms\Components\TextInput::make('percent')->numeric()->suffix('%'),
                Forms\Components\TextInput::make('currency')->default('BDT'),
                Forms\Components\Select::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'due' => 'Due',
                        'paid' => 'Paid',
                        'cancelled' => 'Cancelled',
                    ])->required(),
                Forms\Components\DateTimePicker::make('due_at'),
                Forms\Components\DateTimePicker::make('paid_at'),
                Forms\Components\TextInput::make('payment_reference'),
            ])->columns(3),

            Forms\Components\Textarea::make('notes')->rows(2)->columnSpanFull(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('lead.lead_code')->label('Lead')->searchable(),
                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'platform_service_fee' => 'primary',
                        'institution_commission' => 'success',
                        'agency_processing_fee' => 'warning',
                        'lead_unlock_fee' => 'info',
                        'b2b_profit_share' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('amount')->money('BDT')->sortable(),
                Tables\Columns\TextColumn::make('payer.name')->label('Payer'),
                Tables\Columns\TextColumn::make('payee.name')->label('Payee'),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'paid' => 'success',
                        'due' => 'warning',
                        'pending' => 'gray',
                        'cancelled' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('due_at')->dateTime()->sortable(),
                Tables\Columns\TextColumn::make('paid_at')->dateTime()->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options(['pending' => 'Pending', 'due' => 'Due', 'paid' => 'Paid', 'cancelled' => 'Cancelled']),
                SelectFilter::make('type')
                    ->options([
                        'platform_service_fee' => 'Platform Service Fee',
                        'institution_commission' => 'Institution Commission',
                        'agency_processing_fee' => 'Agency Processing Fee',
                        'lead_unlock_fee' => 'Lead Unlock Fee',
                        'b2b_profit_share' => 'B2B Profit Share',
                        'affiliate_associate' => 'Affiliate (Associate)',
                        'affiliate_global_partner' => 'Affiliate (Global Partner)',
                        'referral_sourcing_fee' => 'Referral Sourcing Fee',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCommissions::route('/'),
            'create' => Pages\CreateCommission::route('/create'),
            'edit' => Pages\EditCommission::route('/{record}/edit'),
        ];
    }
}
