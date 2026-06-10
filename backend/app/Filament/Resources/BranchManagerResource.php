<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchManagerResource\Pages;
use App\Models\Branch;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class BranchManagerResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon  = 'heroicon-o-user-plus';
    protected static ?string $navigationGroup = 'Branches';
    protected static ?string $navigationLabel = 'Branch Managers';
    protected static ?int    $navigationSort  = 6;

    // Only branch_admin (and super admins) can access this
    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin', 'branch_admin']) ?? false;
    }

    // Scope to branch managers of the current branch admin's branch
    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery()
            ->whereHas('roles', fn ($q) => $q->where('name', 'branch_manager'));

        $user = auth()->user();
        if ($user?->hasRole('branch_admin') && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        return $query;
    }

    public static function form(Form $form): Form
    {
        $authUser = auth()->user();
        $isBranchAdmin = $authUser?->hasRole('branch_admin');

        return $form->schema([
            Forms\Components\Section::make('Manager Account')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('email')
                    ->email()
                    ->required()
                    ->unique(User::class, 'email', ignoreRecord: true),

                Forms\Components\TextInput::make('password')
                    ->password()
                    ->dehydrateStateUsing(fn ($state) => $state ? Hash::make($state) : null)
                    ->dehydrated(fn ($state) => filled($state))
                    ->required(fn (string $operation) => $operation === 'create')
                    ->label(fn (string $operation) => $operation === 'create' ? 'Password' : 'New Password (leave blank to keep current)')
                    ->maxLength(255),

                Forms\Components\Select::make('branch_id')
                    ->label('Branch')
                    ->options(fn () => $isBranchAdmin && $authUser->branch_id
                        ? Branch::where('id', $authUser->branch_id)->pluck('name', 'id')
                        : Branch::where('is_active', true)->pluck('name', 'id'))
                    ->default(fn () => $isBranchAdmin ? $authUser->branch_id : null)
                    ->required()
                    ->disabled(fn () => $isBranchAdmin)
                    ->dehydrated(true),

                Forms\Components\Select::make('status')
                    ->options(['active' => 'Active', 'suspended' => 'Suspended'])
                    ->default('active')
                    ->required(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        $authUser = auth()->user();
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('email')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->sortable()
                    ->hidden(fn () => $authUser?->hasRole('branch_admin')),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'active'    => 'success',
                        'suspended' => 'danger',
                        default     => 'gray',
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Added')
                    ->dateTime('d M Y')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('suspend')
                    ->label('Suspend')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (User $record) => $record->status === 'active')
                    ->action(fn (User $record) => $record->update(['status' => 'suspended'])),
                Tables\Actions\Action::make('activate')
                    ->label('Activate')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (User $record) => $record->status !== 'active')
                    ->action(fn (User $record) => $record->update(['status' => 'active'])),
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
            'index'  => Pages\ListBranchManagers::route('/'),
            'create' => Pages\CreateBranchManager::route('/create'),
            'edit'   => Pages\EditBranchManager::route('/{record}/edit'),
        ];
    }
}
