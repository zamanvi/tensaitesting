<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AffiliateResource\Pages;
use App\Models\AffiliateProfile;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AffiliateResource extends Resource
{
    protected static ?string $model = AffiliateProfile::class;
    protected static ?string $navigationIcon  = 'heroicon-o-user-group';
    protected static ?string $navigationGroup = 'Users & Gateways';
    protected static ?string $navigationLabel = 'Affiliates';
    protected static ?int    $navigationSort  = 4;

    public static function form(Form $form): Form
    {
        return $form->schema([

            Forms\Components\Section::make('Affiliate Identity')->schema([
                Forms\Components\TextInput::make('user_name_display')
                    ->label('Name')
                    ->getStateUsing(fn ($record) => $record?->user?->name)
                    ->disabled()
                    ->dehydrated(false),

                Forms\Components\TextInput::make('user_email_display')
                    ->label('Email')
                    ->getStateUsing(fn ($record) => $record?->user?->email)
                    ->disabled()
                    ->dehydrated(false),

                Forms\Components\Select::make('affiliate_type')
                    ->label('Affiliate Type')
                    ->options([
                        'local'  => '🎓 Local — refers students',
                        'global' => '🌐 Global — manages institutions/employees',
                    ])
                    ->required(),

                Forms\Components\Toggle::make('type_confirmed')
                    ->label('Type Confirmed')
                    ->helperText('Uncheck to force affiliate to re-select their type'),

                Forms\Components\Select::make('status')
                    ->options([
                        'active'    => 'Active',
                        'suspended' => 'Suspended',
                    ])
                    ->required(),

                Forms\Components\Select::make('performance_level')
                    ->options([
                        'bronze'   => '🥉 Bronze',
                        'silver'   => '🥈 Silver',
                        'gold'     => '🥇 Gold',
                        'platinum' => '💎 Platinum',
                    ])
                    ->required(),
            ])->columns(2),

            Forms\Components\Section::make('Commission Rates')
                ->description('Set how much this affiliate earns per conversion.')
                ->schema([
                    Forms\Components\TextInput::make('local_commission_fixed')
                        ->label('Local: Fixed Amount (BDT) per enrolled student')
                        ->numeric()
                        ->minValue(0)
                        ->suffix('BDT')
                        ->helperText('Paid when a student referred by this local affiliate gets enrolled'),

                    Forms\Components\TextInput::make('global_commission_percent')
                        ->label('Global: Percent per enrollment')
                        ->numeric()
                        ->minValue(0)
                        ->maxValue(100)
                        ->suffix('%')
                        ->helperText('Percent of deal paid when student enrolls at their managed institution'),
                ])->columns(2),

            Forms\Components\Section::make('Global Affiliate Info')
                ->description('Only relevant for Global type affiliates.')
                ->schema([
                    Forms\Components\TextInput::make('organization_name')
                        ->label('Organization Name'),

                    Forms\Components\TextInput::make('designation')
                        ->label('Designation'),

                    Forms\Components\TextInput::make('website')
                        ->label('Website')
                        ->url(),
                ])->columns(2)
                ->collapsed(),

            Forms\Components\Section::make('Earnings (Read-only)')
                ->schema([
                    Forms\Components\TextInput::make('total_referrals')
                        ->label('Total Referrals')->disabled()->numeric(),

                    Forms\Components\TextInput::make('converted_referrals')
                        ->label('Converted Referrals')->disabled()->numeric(),

                    Forms\Components\TextInput::make('total_earned')
                        ->label('Total Earned (BDT)')->disabled()->numeric(),

                    Forms\Components\TextInput::make('pending_payout')
                        ->label('Pending Payout (BDT)')->disabled()->numeric(),

                    Forms\Components\TextInput::make('managed_institutions_count')
                        ->label('Managed Institutions')->disabled()->numeric(),

                    Forms\Components\TextInput::make('managed_employees_count')
                        ->label('Managed Employees')->disabled()->numeric(),
                ])->columns(3)->collapsed(),

            Forms\Components\Section::make('Payout Details (Read-only)')
                ->schema([
                    Forms\Components\TextInput::make('bank_name')->disabled(),
                    Forms\Components\TextInput::make('bank_account_number')->disabled(),
                    Forms\Components\TextInput::make('bank_account_name')->disabled(),
                    Forms\Components\TextInput::make('bkash_number')->disabled(),
                    Forms\Components\TextInput::make('nagad_number')->disabled(),
                ])->columns(2)->collapsed(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Name')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->description(fn (AffiliateProfile $r) => $r->user?->email),

                Tables\Columns\TextColumn::make('affiliate_type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'global' => 'warning',
                        default  => 'primary',
                    })
                    ->formatStateUsing(fn (string $state) => $state === 'global' ? '🌐 Global' : '🎓 Local'),

                Tables\Columns\TextColumn::make('performance_level')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'platinum' => 'primary',
                        'gold'     => 'warning',
                        'silver'   => 'gray',
                        default    => 'danger',
                    })
                    ->formatStateUsing(fn (string $state) => ucfirst($state)),

                Tables\Columns\TextColumn::make('total_referrals')
                    ->label('Referrals')
                    ->sortable(),

                Tables\Columns\TextColumn::make('converted_referrals')
                    ->label('Converted')
                    ->sortable(),

                Tables\Columns\TextColumn::make('total_earned')
                    ->label('Earned')
                    ->money('BDT')
                    ->sortable(),

                Tables\Columns\TextColumn::make('pending_payout')
                    ->label('Pending')
                    ->money('BDT')
                    ->color('warning')
                    ->sortable(),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'active'    => 'success',
                        'suspended' => 'danger',
                        default     => 'gray',
                    }),

                Tables\Columns\IconColumn::make('type_confirmed')
                    ->label('Onboarded')
                    ->boolean(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('affiliate_type')
                    ->label('Type')
                    ->options(['local' => 'Local', 'global' => 'Global']),

                SelectFilter::make('status')
                    ->options(['active' => 'Active', 'suspended' => 'Suspended']),

                SelectFilter::make('performance_level')
                    ->label('Performance')
                    ->options([
                        'bronze'   => 'Bronze',
                        'silver'   => 'Silver',
                        'gold'     => 'Gold',
                        'platinum' => 'Platinum',
                    ]),
            ])
            ->defaultSort('total_earned', 'desc')
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('suspend')
                    ->label('Suspend')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (AffiliateProfile $r) => $r->status === 'active')
                    ->action(fn (AffiliateProfile $r) => $r->update(['status' => 'suspended'])),

                Tables\Actions\Action::make('activate')
                    ->label('Activate')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (AffiliateProfile $r) => $r->status === 'suspended')
                    ->action(fn (AffiliateProfile $r) => $r->update(['status' => 'active'])),
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
            'index'  => Pages\ListAffiliates::route('/'),
            'edit'   => Pages\EditAffiliate::route('/{record}/edit'),
        ];
    }
}
