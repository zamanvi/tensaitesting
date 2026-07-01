<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AffiliateManagedEntityResource\Pages;
use App\Models\AffiliateManagedEntity;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AffiliateManagedEntityResource extends Resource
{
    protected static ?string $model = AffiliateManagedEntity::class;
    protected static ?string $navigationIcon  = 'heroicon-o-building-office-2';
    protected static ?string $navigationGroup = 'Users & Gateways';
    protected static ?string $navigationLabel = 'Managed Entities';
    protected static ?int    $navigationSort  = 5;
    protected static bool    $shouldRegisterNavigation = false;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Entity Identity')->schema([
                Forms\Components\Select::make('affiliate_user_id')
                    ->label('Global Affiliate')
                    ->relationship('affiliateUser', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),

                Forms\Components\Select::make('entity_type')
                    ->label('Type')
                    ->options([
                        'institution' => 'ðŸ« Institution',
                        'employee'    => 'ðŸ‘¤ Employee / Recruiter',
                    ])
                    ->required(),

                Forms\Components\TextInput::make('name')
                    ->label('Entity Name')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('contact_email')
                    ->email()
                    ->maxLength(255),

                Forms\Components\TextInput::make('contact_phone')
                    ->maxLength(50),

                Forms\Components\TextInput::make('website')
                    ->url()
                    ->maxLength(255),

                Forms\Components\TextInput::make('country')->maxLength(100),
                Forms\Components\TextInput::make('city')->maxLength(100),
                Forms\Components\TextInput::make('specialty')->maxLength(255),
                Forms\Components\TextInput::make('designation')
                    ->label('Designation (Employee)')
                    ->maxLength(255),
            ])->columns(2),

            Forms\Components\Section::make('Admin Controls')->schema([
                Forms\Components\Select::make('status')
                    ->options([
                        'active'    => 'Active',
                        'inactive'  => 'Inactive',
                        'suspended' => 'Suspended',
                    ])
                    ->default('active')
                    ->required(),

                Forms\Components\TextInput::make('commission_percent')
                    ->label('Commission %')
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(100)
                    ->suffix('%'),

                Forms\Components\TextInput::make('capacity')
                    ->label('Intake Capacity')
                    ->numeric()
                    ->minValue(0),

                Forms\Components\Select::make('linked_user_id')
                    ->label('Linked Platform User')
                    ->relationship('linkedUser', 'name')
                    ->searchable()
                    ->nullable()
                    ->helperText('Platform user account for this entity, if any.'),

                Forms\Components\Textarea::make('notes')
                    ->rows(3)
                    ->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('affiliateUser.name')
                    ->label('Affiliate')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('entity_type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'institution' => 'primary',
                        'employee'    => 'info',
                        default       => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => $state === 'institution' ? 'ðŸ« Institution' : 'ðŸ‘¤ Employee'),

                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->description(fn (AffiliateManagedEntity $r) => $r->contact_email),

                Tables\Columns\TextColumn::make('country')
                    ->placeholder('â€”'),

                Tables\Columns\TextColumn::make('commission_percent')
                    ->label('Commission')
                    ->suffix('%')
                    ->sortable(),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'active'    => 'success',
                        'inactive'  => 'gray',
                        'suspended' => 'danger',
                        default     => 'gray',
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('entity_type')
                    ->label('Type')
                    ->options([
                        'institution' => 'Institution',
                        'employee'    => 'Employee',
                    ]),
                SelectFilter::make('status')
                    ->options([
                        'active'    => 'Active',
                        'inactive'  => 'Inactive',
                        'suspended' => 'Suspended',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('activate')
                    ->label('Activate')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (AffiliateManagedEntity $r) => $r->status !== 'active')
                    ->action(fn (AffiliateManagedEntity $r) => $r->update(['status' => 'active'])),

                Tables\Actions\Action::make('suspend')
                    ->label('Suspend')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (AffiliateManagedEntity $r) => $r->status === 'active')
                    ->action(fn (AffiliateManagedEntity $r) => $r->update(['status' => 'suspended'])),

                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListAffiliateManagedEntities::route('/'),
            'create' => Pages\CreateAffiliateManagedEntity::route('/create'),
            'edit'   => Pages\EditAffiliateManagedEntity::route('/{record}/edit'),
        ];
    }
}
