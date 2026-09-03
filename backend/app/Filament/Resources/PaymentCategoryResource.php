<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PaymentCategoryResource\Pages;
use App\Models\PaymentCategory;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PaymentCategoryResource extends Resource
{
    protected static ?string $model         = PaymentCategory::class;
    protected static ?string $navigationIcon  = 'heroicon-o-tag';
    protected static ?string $navigationGroup = 'Revenue';
    protected static ?string $navigationLabel = 'Memo Categories';
    protected static ?string $modelLabel       = 'Memo Category';
    protected static ?string $pluralModelLabel = 'Memo Categories';
    protected static ?int    $navigationSort  = 3;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    // A category with payment history can't be deleted (the payments table
    // restricts that FK on purpose — see the migration). Blocking it here
    // too means the delete button just disappears instead of the admin
    // hitting a raw database error.
    public static function canDelete($record): bool
    {
        return !$record->payments()->exists();
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('key')
                    ->label('Key')
                    ->required()
                    ->maxLength(64)
                    ->unique(ignoreRecord: true)
                    ->helperText('Internal identifier, e.g. course_fee. Not shown to branch staff.')
                    ->disabled(fn (string $operation) => $operation === 'edit'),

                Forms\Components\TextInput::make('label')
                    ->label('Label')
                    ->required()
                    ->maxLength(255)
                    ->helperText('Shown in the branch dashboard\'s memo dropdown.'),

                Forms\Components\Select::make('fund_target')
                    ->label('Routes To')
                    ->options([
                        'branch'      => 'Branch Fund',
                        'head_office' => 'Head Office Fund',
                    ])
                    ->required()
                    ->native(false)
                    ->helperText('A memo created under this category is credited here automatically — no approval step.'),

                Forms\Components\TextInput::make('sort_order')
                    ->label('Sort Order')
                    ->numeric()
                    ->default(0),

                Forms\Components\Toggle::make('is_active')
                    ->label('Active')
                    ->default(true)
                    ->helperText('Inactive categories no longer appear in the branch dropdown, but past memos keep their history.'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('sort_order')
            ->columns([
                Tables\Columns\TextColumn::make('label')->searchable()->weight('semibold'),
                Tables\Columns\TextColumn::make('key')->fontFamily('mono')->color('gray')->toggleable(),
                Tables\Columns\TextColumn::make('fund_target')
                    ->label('Routes To')
                    ->badge()
                    ->formatStateUsing(fn ($state) => $state === 'branch' ? 'Branch Fund' : 'Head Office Fund')
                    ->color(fn ($state) => $state === 'branch' ? 'success' : 'info'),
                Tables\Columns\IconColumn::make('is_active')->boolean()->label('Active'),
                Tables\Columns\TextColumn::make('sort_order')->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ]);
            // No bulk delete here — a category with payment history is
            // individually protected by canDelete() above, but a bulk action
            // would need the same per-row check re-implemented to be safe.
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListPaymentCategories::route('/'),
            'create' => Pages\CreatePaymentCategory::route('/create'),
            'edit'   => Pages\EditPaymentCategory::route('/{record}/edit'),
        ];
    }
}
