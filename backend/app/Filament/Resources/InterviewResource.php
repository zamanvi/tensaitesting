<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InterviewResource\Pages;
use App\Models\Interview;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class InterviewResource extends Resource
{
    protected static ?string $model = Interview::class;
    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';
    protected static ?string $navigationGroup = 'Applicant Management';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Interview Details')->schema([
                Forms\Components\Select::make('lead_id')
                    ->label('Lead')
                    ->relationship('lead', 'lead_code')
                    ->searchable()->required(),
                Forms\Components\Select::make('student_id')
                    ->label('Student')
                    ->relationship('student', 'name')
                    ->searchable()->required(),
                Forms\Components\Select::make('institution_id')
                    ->label('Institution')
                    ->relationship('institution', 'name')
                    ->searchable()->required(),
                Forms\Components\Select::make('arranged_by')
                    ->label('Arranged By (Admin)')
                    ->options(fn () => User::whereHas('roles', fn ($q) => $q->whereIn('name', ['super_admin', 'admin']))->pluck('name', 'id'))
                    ->default(fn () => auth()->id())
                    ->searchable(),
            ])->columns(2),

            Forms\Components\Section::make('Schedule')->schema([
                Forms\Components\Select::make('medium')
                    ->options([
                        'zoom' => 'Zoom',
                        'google_meet' => 'Google Meet',
                        'teams' => 'Microsoft Teams',
                        'phone' => 'Phone',
                        'in_person' => 'In Person',
                    ])->required(),
                Forms\Components\Select::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'confirmed' => 'Confirmed',
                        'completed' => 'Completed',
                        'cancelled' => 'Cancelled',
                        'rescheduled' => 'Rescheduled',
                    ])->required(),
                Forms\Components\DateTimePicker::make('scheduled_at'),
                Forms\Components\DateTimePicker::make('confirmed_at'),
                Forms\Components\TextInput::make('meeting_link')->label('Meeting Link'),
                Forms\Components\TextInput::make('duration_minutes')->numeric()->label('Duration (min)'),
            ])->columns(2),

            Forms\Components\Section::make('Notes')->schema([
                Forms\Components\Textarea::make('admin_notes')->rows(3),
                Forms\Components\Textarea::make('institution_notes')->rows(3),
                Forms\Components\Select::make('result')
                    ->options([
                        'pending' => 'Pending',
                        'passed'  => 'Passed',
                        'failed'  => 'Failed',
                    ])
                    ->default('pending'),
                Forms\Components\DateTimePicker::make('completed_at')
                    ->label('Completed At'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('ID')->sortable(),
                Tables\Columns\TextColumn::make('lead.lead_code')->label('Lead'),
                Tables\Columns\TextColumn::make('student.name')->label('Student')->searchable(),
                Tables\Columns\TextColumn::make('institution.name')->label('Institution')->searchable(),
                Tables\Columns\TextColumn::make('medium')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'zoom', 'google_meet', 'teams' => 'info',
                        'phone' => 'warning',
                        'in_person' => 'success',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'confirmed' => 'success',
                        'pending' => 'warning',
                        'completed' => 'primary',
                        'cancelled' => 'danger',
                        'rescheduled' => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('scheduled_at')->dateTime()->sortable(),
                Tables\Columns\TextColumn::make('result')
                    ->badge()
                    ->color(fn ($state) => match ($state) {
                        'passed'  => 'success',
                        'failed'  => 'danger',
                        'pending' => 'warning',
                        default   => 'gray',
                    }),
                Tables\Columns\TextColumn::make('completed_at')
                    ->label('Completed')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'confirmed' => 'Confirmed',
                        'completed' => 'Completed',
                        'cancelled' => 'Cancelled',
                        'rescheduled' => 'Rescheduled',
                    ]),
                SelectFilter::make('medium')
                    ->options([
                        'zoom' => 'Zoom',
                        'google_meet' => 'Google Meet',
                        'teams' => 'Microsoft Teams',
                        'phone' => 'Phone',
                        'in_person' => 'In Person',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('complete')
                    ->label('Complete')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (Interview $r) => !in_array($r->status, ['completed', 'cancelled']))
                    ->action(function (Interview $r) {
                        $r->update(['status' => 'completed', 'completed_at' => now()]);
                        $r->lead?->update(['status' => 'interview_scheduled']);
                        \Filament\Notifications\Notification::make()->title('Interview marked complete')->success()->send();
                    }),

                Tables\Actions\Action::make('cancel')
                    ->label('Cancel')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Interview $r) => !in_array($r->status, ['completed', 'cancelled']))
                    ->action(function (Interview $r) {
                        $r->update(['status' => 'cancelled']);
                        \Filament\Notifications\Notification::make()->title('Interview cancelled')->warning()->send();
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
            'index' => Pages\ListInterviews::route('/'),
            'create' => Pages\CreateInterview::route('/create'),
            'edit' => Pages\EditInterview::route('/{record}/edit'),
        ];
    }
}
