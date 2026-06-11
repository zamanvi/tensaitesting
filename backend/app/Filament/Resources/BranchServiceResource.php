<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchServiceResource\Pages;
use App\Models\Branch;
use App\Models\BranchService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BranchServiceResource extends Resource
{
    protected static ?string $model = BranchService::class;
    protected static ?string $navigationIcon  = 'heroicon-o-sparkles';
    protected static ?string $navigationGroup = 'Branches';
    protected static ?string $navigationLabel = 'Branch Services';
    protected static ?int    $navigationSort  = 5;
    protected static bool $shouldRegisterNavigation = false;

    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $user  = auth()->user();
        if ($user?->hasRole(['branch_admin', 'branch_manager']) && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }
        return $query;
    }

    public static function form(Form $form): Form
    {
        $user = auth()->user();
        return $form->schema([
            Forms\Components\Select::make('branch_id')
                ->label('Branch')
                ->options(fn () => $user?->hasRole(['branch_admin', 'branch_manager'])
                    ? Branch::where('id', $user->branch_id)->pluck('name', 'id')
                    : Branch::pluck('name', 'id'))
                ->required()
                ->default(fn () => $user?->branch_id),

            Forms\Components\TextInput::make('title')->required()->maxLength(255),
            Forms\Components\TextInput::make('icon')->label('Icon (emoji)')->placeholder('e.g. 🎓')->maxLength(10),
            Forms\Components\Textarea::make('description')->rows(3)->columnSpanFull(),
            Forms\Components\TextInput::make('sort_order')->numeric()->default(0),
            Forms\Components\Toggle::make('is_active')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        $user = auth()->user();
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->sortable()
                    ->hidden(fn () => $user?->hasRole(['branch_admin', 'branch_manager'])),

                Tables\Columns\TextColumn::make('icon')->label('Icon'),
                Tables\Columns\TextColumn::make('title')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('description')->limit(50)->placeholder('—'),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
                Tables\Columns\TextColumn::make('sort_order')->sortable(),
            ])
            ->defaultSort('sort_order')
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
            'index'  => Pages\ListBranchServices::route('/'),
            'create' => Pages\CreateBranchService::route('/create'),
            'edit'   => Pages\EditBranchService::route('/{record}/edit'),
        ];
    }
}
