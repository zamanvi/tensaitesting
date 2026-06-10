<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchTeamMemberResource\Pages;
use App\Models\Branch;
use App\Models\BranchTeamMember;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BranchTeamMemberResource extends Resource
{
    protected static ?string $model = BranchTeamMember::class;
    protected static ?string $navigationIcon  = 'heroicon-o-user-group';
    protected static ?string $navigationGroup = 'Branches';
    protected static ?string $navigationLabel = 'Team Members';
    protected static ?int    $navigationSort  = 3;

    // Branch admins/managers only see their own branch
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
            Forms\Components\Section::make('Team Member Details')->schema([
                Forms\Components\Select::make('branch_id')
                    ->label('Branch')
                    ->options(fn () => $user?->hasRole(['branch_admin', 'branch_manager'])
                        ? Branch::where('id', $user->branch_id)->pluck('name', 'id')
                        : Branch::pluck('name', 'id'))
                    ->required()
                    ->default(fn () => $user?->branch_id),

                Forms\Components\TextInput::make('name')->required()->maxLength(255),
                Forms\Components\TextInput::make('role')->label('Job Title / Role')->maxLength(255),
                Forms\Components\TextInput::make('email')->email(),
                Forms\Components\TextInput::make('phone'),
                Forms\Components\Textarea::make('bio')->rows(3)->columnSpanFull(),
                Forms\Components\FileUpload::make('photo')
                    ->image()
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('branches/team')
                    ->visibility('public')
                    ->maxSize(2048)
                    ->columnSpanFull(),
            ])->columns(2),

            Forms\Components\Section::make('Status')->schema([
                Forms\Components\Toggle::make('is_active')->default(true),
                Forms\Components\TextInput::make('sort_order')->numeric()->default(0),
            ])->columns(2),
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

                Tables\Columns\TextColumn::make('name')->searchable()->sortable()->weight('bold'),
                Tables\Columns\TextColumn::make('role')->label('Role')->placeholder('—'),
                Tables\Columns\TextColumn::make('email')->placeholder('—'),
                Tables\Columns\IconColumn::make('is_active')->boolean(),
                Tables\Columns\TextColumn::make('sort_order')->label('Order')->sortable(),
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
            'index'  => Pages\ListBranchTeamMembers::route('/'),
            'create' => Pages\CreateBranchTeamMember::route('/create'),
            'edit'   => Pages\EditBranchTeamMember::route('/{record}/edit'),
        ];
    }
}
