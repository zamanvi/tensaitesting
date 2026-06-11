<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchGalleryResource\Pages;
use App\Models\Branch;
use App\Models\BranchGalleryItem;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BranchGalleryResource extends Resource
{
    protected static ?string $model = BranchGalleryItem::class;
    protected static ?string $navigationIcon  = 'heroicon-o-photo';
    protected static ?string $navigationGroup = 'Branches';
    protected static ?string $navigationLabel = 'Branch Gallery';
    protected static ?int    $navigationSort  = 4;
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

            Forms\Components\FileUpload::make('image_path')
                ->label('Image')
                ->image()
                ->disk(app()->environment('production') ? 'r2' : 'public')
                ->directory('branches/gallery')
                ->visibility('public')
                ->maxSize(8192)
                ->columnSpanFull(),

            Forms\Components\TextInput::make('image_url')
                ->label('Or paste image URL')
                ->url()
                ->columnSpanFull(),

            Forms\Components\TextInput::make('caption')->maxLength(255),
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

                Tables\Columns\TextColumn::make('caption')->placeholder('—')->limit(40),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
                Tables\Columns\TextColumn::make('sort_order')->sortable(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
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
            'index'  => Pages\ListBranchGalleries::route('/'),
            'create' => Pages\CreateBranchGallery::route('/create'),
            'edit'   => Pages\EditBranchGallery::route('/{record}/edit'),
        ];
    }
}
