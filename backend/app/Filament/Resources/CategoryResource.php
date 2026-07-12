<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CategoryResource\Pages;
use App\Models\Category;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CategoryResource extends Resource
{
    protected static ?string $model                = Category::class;
    protected static ?string $navigationIcon       = 'heroicon-o-tag';
    protected static ?string $navigationLabel      = 'Categories';
    protected static ?string $navigationGroup      = 'Content';
    protected static ?int    $navigationSort       = 2;
    protected static ?string $recordTitleAttribute = 'name';

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Category Details')
                ->description('Country = destination (Japan, UK…). Purpose = goal (Higher Study, Work…).')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->maxLength(100),

                    Forms\Components\TextInput::make('slug')
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->maxLength(100)
                        ->helperText('Used in URL: /feed?country=japan'),

                    Forms\Components\Select::make('type')
                        ->options(['country' => 'Country', 'purpose' => 'Purpose'])
                        ->required(),

                    Forms\Components\TextInput::make('flag')
                        ->label('Emoji')
                        ->maxLength(10)
                        ->placeholder('🇯🇵'),

                    Forms\Components\TextInput::make('sort_order')
                        ->numeric()
                        ->default(0)
                        ->helperText('Lower = shown first'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('flag')->label(''),

                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn ($state) => $state === 'country' ? 'primary' : 'success'),

                Tables\Columns\TextColumn::make('posts_count')
                    ->label('Posts')
                    ->counts('posts')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('sort_order')
                    ->sortable()
                    ->label('Order'),
            ])
            ->defaultSort('type')
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->options(['country' => 'Country', 'purpose' => 'Purpose']),
            ])
            ->actions([Tables\Actions\EditAction::make()])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListCategories::route('/'),
            'create' => Pages\CreateCategory::route('/create'),
            'edit'   => Pages\EditCategory::route('/{record}/edit'),
        ];
    }
}
