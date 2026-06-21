<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SettingResource\Pages;
use App\Models\Setting;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SettingResource extends Resource
{
    protected static ?string $model = Setting::class;
    protected static ?string $navigationIcon  = 'heroicon-o-cog-6-tooth';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $navigationLabel = 'Platform Settings';
    protected static ?int    $navigationSort  = 1;
    protected static bool    $shouldRegisterNavigation = false;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Setting')->schema([
                Forms\Components\TextInput::make('key')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->placeholder('e.g. facebook_url')
                    ->helperText('Lowercase with underscores. Do not change existing keys.')
                    ->disabled(fn ($record) => $record !== null),

                Forms\Components\TextInput::make('label')
                    ->label('Display Label')
                    ->placeholder('e.g. Facebook Page URL')
                    ->maxLength(255),

                Forms\Components\Textarea::make('value')
                    ->label('Value')
                    ->rows(2)
                    ->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('label')
                    ->label('Setting')
                    ->searchable()
                    ->sortable()
                    ->weight('semibold')
                    ->description(fn (Setting $record) => $record->key)
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('value')
                    ->label('Current Value')
                    ->limit(60)
                    ->searchable()
                    ->placeholder('(empty)'),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->since()
                    ->sortable(),
            ])
            ->groups([
                Tables\Grouping\Group::make('label')
                    ->label('Setting'),
            ])
            ->defaultSort('key')
            ->actions([
                Tables\Actions\Action::make('quick_edit')
                    ->label('Edit Value')
                    ->icon('heroicon-o-pencil')
                    ->color('primary')
                    ->fillForm(fn (Setting $record) => ['value' => $record->value])
                    ->form([
                        Forms\Components\Placeholder::make('key_display')
                            ->label('Setting Key')
                            ->content(fn (Setting $record) => $record->key),
                        Forms\Components\Textarea::make('value')
                            ->label(fn (Setting $record) => $record->label ?? 'Value')
                            ->rows(3)
                            ->required(),
                    ])
                    ->action(function (Setting $record, array $data) {
                        $record->update(['value' => $data['value']]);
                        Notification::make()->title('Setting saved')->success()->send();
                    }),
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
            'index'  => Pages\ListSettings::route('/'),
            'create' => Pages\CreateSetting::route('/create'),
            'edit'   => Pages\EditSetting::route('/{record}/edit'),
        ];
    }
}
