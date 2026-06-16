<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchResource\Pages;
use App\Models\Branch;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BranchResource extends Resource
{
    protected static ?string $model = Branch::class;
    protected static ?string $navigationIcon  = 'heroicon-o-building-storefront';
    protected static ?string $navigationGroup = 'Branches';
    protected static ?string $navigationLabel = 'Branches';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        $isCreate = $form->getOperation() === 'create';

        return $form->schema([

            // ── CREATE: simple 2-section form ──────────────────────────────
            Forms\Components\Section::make('Branch Info')
                ->key('branch-info-create')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Branch Name')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn ($state, callable $set) =>
                            $set('slug', Str::slug($state))),

                    Forms\Components\Hidden::make('slug')
                        ->dehydrateStateUsing(fn ($state, $get) => $state ?: Str::slug($get('name'))),

                    Forms\Components\TextInput::make('city')
                        ->required()
                        ->placeholder('e.g. Dhaka'),

                    Forms\Components\TextInput::make('country')
                        ->required()
                        ->default('Bangladesh'),
                ])
                ->columns(2)
                ->visibleOn('create'),

            Forms\Components\Section::make('Manager Account')
                ->key('manager-account-create')
                ->description('Manager will log in with their name and password.')
                ->schema([
                    Forms\Components\TextInput::make('manager_name')
                        ->label('Manager Name (Login Username)')
                        ->required()
                        ->maxLength(255)
                        ->helperText('Manager logs in with this name + password. Must be unique.')
                        ->unique('users', 'name')
                        ->autocomplete('off')
                        ->dehydrated(false),

                    Forms\Components\TextInput::make('manager_password')
                        ->label('Password')
                        ->password()
                        ->revealable()
                        ->required()
                        ->minLength(6)
                        ->helperText('Copy and send to manager manually.')
                        ->autocomplete('new-password')
                        ->dehydrated(false),

                    Forms\Components\TextInput::make('manager_password_confirmation')
                        ->label('Confirm Password')
                        ->password()
                        ->revealable()
                        ->required()
                        ->minLength(6)
                        ->autocomplete('new-password')
                        ->dehydrated(false)
                        ->rules([
                            fn (\Filament\Forms\Get $get): \Closure => function (string $attribute, $value, \Closure $fail) use ($get) {
                                if ($value !== $get('manager_password')) {
                                    $fail('Passwords do not match.');
                                }
                            },
                        ]),

                    Forms\Components\TextInput::make('manager_phone')
                        ->label('Phone')
                        ->placeholder('+880 1XXX-XXXXXX')
                        ->dehydrated(false),

                    Forms\Components\TextInput::make('manager_whatsapp')
                        ->label('WhatsApp')
                        ->placeholder('8801XXXXXXXXX')
                        ->dehydrated(false),
                ])
                ->columns(2)
                ->visibleOn('create'),

            // ── EDIT: same clean 2-section layout as create ────────────────
            Forms\Components\Section::make('Branch Info')
                ->key('branch-info-edit')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Branch Name')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn ($state, callable $set) =>
                            $set('slug', Str::slug($state))),

                    Forms\Components\Hidden::make('slug')
                        ->dehydrateStateUsing(fn ($state, $get) => $state ?: Str::slug($get('name'))),

                    Forms\Components\TextInput::make('city')
                        ->required()
                        ->placeholder('e.g. Dhaka'),

                    Forms\Components\TextInput::make('country')
                        ->required()
                        ->default('Bangladesh'),
                ])
                ->columns(2)
                ->visibleOn('edit'),

            Forms\Components\Section::make('Manager Account')
                ->key('manager-account-edit')
                ->description('Update manager credentials. Leave password blank to keep existing.')
                ->schema([
                    Forms\Components\TextInput::make('manager_name_edit')
                        ->label('Manager Name (Login Username)')
                        ->helperText('Manager logs in with this name + password.')
                        ->autocomplete('off'),

                    Forms\Components\TextInput::make('manager_password_edit')
                        ->label('Password')
                        ->password()
                        ->revealable()
                        ->helperText('Leave blank to keep current password.')
                        ->autocomplete('new-password'),

                    Forms\Components\TextInput::make('manager_password_edit_confirmation')
                        ->label('Confirm Password')
                        ->password()
                        ->revealable()
                        ->helperText('Must match new password if changing.')
                        ->autocomplete('new-password')
                        ->rules([
                            fn (\Filament\Forms\Get $get): \Closure => function (string $attribute, $value, \Closure $fail) use ($get) {
                                $newPass = $get('manager_password_edit');
                                if ($newPass && $value !== $newPass) {
                                    $fail('Passwords do not match.');
                                }
                            },
                        ]),

                    Forms\Components\TextInput::make('manager_phone_edit')
                        ->label('Phone')
                        ->placeholder('+880 1XXX-XXXXXX'),

                    Forms\Components\TextInput::make('manager_whatsapp_edit')
                        ->label('WhatsApp')
                        ->placeholder('8801XXXXXXXXX'),
                ])
                ->columns(2)
                ->visibleOn('edit'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->description(fn (Branch $r) => trim($r->city . ', ' . $r->country, ', ')),

                Tables\Columns\TextColumn::make('manager_name')
                    ->label('Manager (Login Username)')
                    ->getStateUsing(fn (Branch $r) => DB::table('users')
                        ->where('branch_id', $r->id)
                        ->where('gateway_type', 'branch')
                        ->value('name'))
                    ->placeholder('⚠ No manager')
                    ->badge()
                    ->color('success')
                    ->copyable()
                    ->copyMessage('Username copied!'),

                Tables\Columns\TextColumn::make('manager_password')
                    ->label('Password')
                    ->getStateUsing(fn (Branch $r) => DB::table('users')
                        ->where('branch_id', $r->id)
                        ->where('gateway_type', 'branch')
                        ->value('manager_plain_password'))
                    ->placeholder('—')
                    ->copyable()
                    ->copyMessage('Password copied!')
                    ->icon('heroicon-o-key')
                    ->formatStateUsing(fn ($state) => $state ? '••••••' : '—')
                    ->tooltip(fn ($state) => $state),

                Tables\Columns\TextColumn::make('manager_phone')
                    ->label('Phone')
                    ->getStateUsing(fn (Branch $r) => DB::table('users')
                        ->where('branch_id', $r->id)
                        ->where('gateway_type', 'branch')
                        ->value('phone'))
                    ->placeholder('—')
                    ->copyable()
                    ->icon('heroicon-o-phone'),

                Tables\Columns\TextColumn::make('manager_whatsapp')
                    ->label('WhatsApp')
                    ->getStateUsing(fn (Branch $r) => DB::table('users')
                        ->where('branch_id', $r->id)
                        ->where('gateway_type', 'branch')
                        ->value('whatsapp'))
                    ->placeholder('—')
                    ->copyable()
                    ->icon('heroicon-o-chat-bubble-left-ellipsis'),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('access_link')
                    ->label('Login Link')
                    ->getStateUsing(fn () => rtrim(config('app.frontend_url', config('app.url')), '/') . '/auth/login')
                    ->copyable()
                    ->copyMessage('Login URL copied!')
                    ->color('primary')
                    ->icon('heroicon-o-link'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('d M Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')->label('Active status'),
            ])
            ->actions([
                Tables\Actions\Action::make('remove_manager')
                    ->label('Remove Manager')
                    ->icon('heroicon-o-user-minus')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Remove Manager Account')
                    ->modalDescription('This will permanently delete the manager user account. All branch data (applications, gallery, team) stays intact. You can assign a new manager from the Edit page.')
                    ->visible(fn (Branch $record) => $record->admins()->exists())
                    ->action(function (Branch $record) {
                        $record->admins()->each(function ($admin) {
                            $admin->tokens()->delete();
                            $admin->delete();
                        });
                        \Filament\Notifications\Notification::make()
                            ->title('Manager removed')
                            ->body('Branch data is intact. Assign a new manager from Edit.')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
            'index'  => Pages\ListBranches::route('/'),
            'create' => Pages\CreateBranch::route('/create'),
            'edit'   => Pages\EditBranch::route('/{record}/edit'),
        ];
    }
}
