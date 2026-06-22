<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TensaiNotificationResource\Pages;
use App\Models\TensaiNotification;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TensaiNotificationResource extends Resource
{
    protected static ?string $model = TensaiNotification::class;
    protected static ?string $navigationIcon  = 'heroicon-o-bell';
    protected static ?string $navigationGroup = 'Support';
    protected static ?string $navigationLabel = 'Notifications';
    protected static ?int    $navigationSort  = 3;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) TensaiNotification::where('is_read', false)->count() ?: null;
    }

    public static function getNavigationBadgeColor(): string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Notification Details')->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Recipient')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload()
                    ->required()
                    ->helperText('Select the user who will receive this notification.'),

                Forms\Components\Select::make('type')
                    ->options([
                        'info'    => 'â„¹ï¸ Info',
                        'success' => 'âœ… Success',
                        'warning' => 'âš ï¸ Warning',
                        'error'   => 'âŒ Error',
                        'system'  => 'ðŸ”§ System',
                    ])
                    ->default('info')
                    ->required(),

                Forms\Components\TextInput::make('title')
                    ->required()
                    ->maxLength(255)
                    ->columnSpanFull(),

                Forms\Components\Textarea::make('body')
                    ->label('Message')
                    ->rows(4)
                    ->required()
                    ->columnSpanFull(),

                Forms\Components\TextInput::make('action_url')
                    ->label('Action URL')
                    ->url()
                    ->placeholder('https://...')
                    ->helperText('Optional link when user taps the notification.'),

                Forms\Components\Toggle::make('is_read')
                    ->label('Mark as Read')
                    ->default(false),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Recipient')
                    ->searchable()
                    ->sortable()
                    ->description(fn (TensaiNotification $r) => $r->user?->email),

                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'success' => 'success',
                        'warning' => 'warning',
                        'error'   => 'danger',
                        'system'  => 'gray',
                        default   => 'info',
                    }),

                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->limit(50),

                Tables\Columns\TextColumn::make('body')
                    ->label('Message')
                    ->limit(60)
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\IconColumn::make('is_read')
                    ->label('Read')
                    ->boolean(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Sent')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('type')
                    ->options([
                        'info'    => 'Info',
                        'success' => 'Success',
                        'warning' => 'Warning',
                        'error'   => 'Error',
                        'system'  => 'System',
                    ]),
                Tables\Filters\TernaryFilter::make('is_read')->label('Read status'),
            ])
            ->actions([
                Tables\Actions\Action::make('mark_read')
                    ->label('Mark Read')
                    ->icon('heroicon-o-check')
                    ->color('success')
                    ->visible(fn (TensaiNotification $r) => !$r->is_read)
                    ->action(fn (TensaiNotification $r) => $r->markRead()),

                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('mark_all_read')
                    ->label('Mark as Read')
                    ->icon('heroicon-o-check-circle')
                    ->action(fn ($records) => $records->each(fn ($r) => $r->markRead())),

                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListTensaiNotifications::route('/'),
            'create' => Pages\CreateTensaiNotification::route('/create'),
            'edit'   => Pages\EditTensaiNotification::route('/{record}/edit'),
        ];
    }
}
