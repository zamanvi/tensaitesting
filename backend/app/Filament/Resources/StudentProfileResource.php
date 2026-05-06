<?php

namespace App\Filament\Resources;

use App\Filament\Resources\StudentProfileResource\Pages;
use App\Models\StudentProfile;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class StudentProfileResource extends Resource
{
    protected static ?string $model = StudentProfile::class;
    protected static ?string $navigationIcon = 'heroicon-o-academic-cap';
    protected static ?string $navigationGroup = 'User Management';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Personal Information')->schema([
                Forms\Components\TextInput::make('full_name')->maxLength(255),
                Forms\Components\TextInput::make('full_name_japanese'),
                Forms\Components\DatePicker::make('date_of_birth'),
                Forms\Components\Select::make('gender')
                    ->options(['male' => 'Male', 'female' => 'Female', 'other' => 'Other']),
                Forms\Components\TextInput::make('nationality'),
                Forms\Components\TextInput::make('religion'),
            ])->columns(2),

            Forms\Components\Section::make('Education')->schema([
                Forms\Components\TextInput::make('highest_qualification'),
                Forms\Components\TextInput::make('institution_name'),
                Forms\Components\TextInput::make('gpa')->numeric(),
                Forms\Components\TextInput::make('passing_year')->numeric(),
            ])->columns(2),

            Forms\Components\Section::make('Language Scores')->schema([
                Forms\Components\Select::make('jlpt_level')
                    ->options(['N1' => 'N1', 'N2' => 'N2', 'N3' => 'N3', 'N4' => 'N4', 'N5' => 'N5']),
                Forms\Components\Select::make('nat_level')
                    ->options(['1' => '1', '2' => '2', '3' => '3', '4' => '4', '5' => '5']),
                Forms\Components\TextInput::make('ielts_score')->numeric(),
            ])->columns(3),

            Forms\Components\Section::make('Admin Controls')->schema([
                Forms\Components\Toggle::make('is_admin_verified')->label('Admin Verified'),
                Forms\Components\Toggle::make('is_data_locked')->label('Data Locked'),
                Forms\Components\TextInput::make('nid_number')->label('NID Number'),
                Forms\Components\TextInput::make('passport_number'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->label('Student')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('full_name')->searchable(),
                Tables\Columns\TextColumn::make('jlpt_level')->badge()->color('info'),
                Tables\Columns\TextColumn::make('nat_level')->badge()->color('warning'),
                Tables\Columns\TextColumn::make('gpa')->sortable(),
                Tables\Columns\TextColumn::make('highest_qualification'),
                Tables\Columns\IconColumn::make('is_admin_verified')->boolean()->label('Verified'),
                Tables\Columns\IconColumn::make('is_data_locked')->boolean()->label('Locked'),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('jlpt_level')
                    ->options(['N1' => 'N1', 'N2' => 'N2', 'N3' => 'N3', 'N4' => 'N4', 'N5' => 'N5']),
                Tables\Filters\TernaryFilter::make('is_admin_verified')->label('Verified'),
                Tables\Filters\TernaryFilter::make('is_data_locked')->label('Data Locked'),
            ])
            ->actions([
                Tables\Actions\Action::make('verify')
                    ->label('Verify')
                    ->icon('heroicon-o-check-badge')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (StudentProfile $record) => !$record->is_admin_verified)
                    ->action(function (StudentProfile $record) {
                        $record->update(['is_admin_verified' => true]);
                        Notification::make()->title('Student verified')->success()->send();
                    }),

                Tables\Actions\Action::make('toggle_lock')
                    ->label(fn (StudentProfile $record) => $record->is_data_locked ? 'Unlock Data' : 'Lock Data')
                    ->icon(fn (StudentProfile $record) => $record->is_data_locked ? 'heroicon-o-lock-open' : 'heroicon-o-lock-closed')
                    ->color(fn (StudentProfile $record) => $record->is_data_locked ? 'warning' : 'gray')
                    ->requiresConfirmation()
                    ->action(function (StudentProfile $record) {
                        if ($record->is_data_locked) {
                            $record->update(['is_data_locked' => false]);
                            Notification::make()->title('Data unlocked')->warning()->send();
                        } else {
                            $record->lock(auth()->id());
                            Notification::make()->title('Data locked')->success()->send();
                        }
                    }),

                Tables\Actions\EditAction::make(),
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
            'index' => Pages\ListStudentProfiles::route('/'),
            'create' => Pages\CreateStudentProfile::route('/create'),
            'edit' => Pages\EditStudentProfile::route('/{record}/edit'),
        ];
    }
}
