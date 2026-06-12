<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ManagerResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ManagerResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-user-group';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $navigationLabel = 'Managers';
    protected static ?int $navigationSort = 10;
    protected static ?string $slug = 'managers';

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()->whereHas('roles', fn ($q) => $q->where('name', 'manager'));
    }

    public static function form(Form $form): Form
    {
        $sections = [
            'Lead Management'   => 'Lead Management',
            'Verification'      => 'Verification',
            'Users & Gateways'  => 'Users & Gateways',
            'Branches'          => 'Branches',
            'Support'           => 'Support',
            'Earnings & Payouts'=> 'Earnings & Payouts',
            'Content'           => 'Content',
            'Settings'          => 'Settings',
        ];

        return $form->schema([
            Forms\Components\Section::make('Manager Account')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()->maxLength(255),
                Forms\Components\TextInput::make('email')
                    ->email()->required()->unique(ignoreRecord: true),
                Forms\Components\TextInput::make('plain_password')
                    ->label('Password')
                    ->password()
                    ->revealable()
                    ->required(fn (string $operation) => $operation === 'create')
                    ->dehydrated(fn ($state) => filled($state))
                    ->dehydrateStateUsing(fn ($state) => Hash::make($state))
                    ->helperText('Leave blank to keep existing password'),
            ])->columns(3),

            Forms\Components\Section::make('Assigned Sections')
                ->description('Select which admin panel sections this manager can access.')
                ->schema([
                    Forms\Components\CheckboxList::make('manager_sections')
                        ->label('')
                        ->options($sections)
                        ->columns(4)
                        ->required()
                        ->gridDirection('row'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('email')->searchable(),
                Tables\Columns\TextColumn::make('manager_sections')
                    ->label('Sections')
                    ->formatStateUsing(fn ($state) => is_array($state) ? implode(', ', $state) : '—')
                    ->wrap(),
                Tables\Columns\TextColumn::make('manager_plain_password')
                    ->label('Password')
                    ->formatStateUsing(fn ($state) => $state ?? '—')
                    ->copyable()
                    ->copyMessage('Password copied'),
                Tables\Columns\TextColumn::make('manager_login_link')
                    ->label('Login Link')
                    ->getStateUsing(fn () => url('/manager'))
                    ->copyable()
                    ->copyMessage('Link copied'),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListManagers::route('/'),
            'create' => Pages\CreateManager::route('/create'),
            'edit'   => Pages\EditManager::route('/{record}/edit'),
        ];
    }
}
