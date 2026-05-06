<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LeadResource\Pages;
use App\Models\Lead;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;

class LeadResource extends Resource
{
    protected static ?string $model = Lead::class;
    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $navigationGroup = 'Lead Management';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Lead Info')->schema([
                Forms\Components\TextInput::make('lead_code')->disabled(),
                Forms\Components\Select::make('student_id')
                    ->label('Student')
                    ->relationship('student', 'name')
                    ->searchable()->required(),
                Forms\Components\Select::make('pool_type')
                    ->options(['open' => 'Open Pool', 'private' => 'Private Vault'])
                    ->required(),
                Forms\Components\Select::make('status')
                    ->options([
                        'new' => 'New',
                        'profile_complete' => 'Profile Complete',
                        'under_review' => 'Under Review',
                        'shortlisted' => 'Shortlisted',
                        'interview_scheduled' => 'Interview Scheduled',
                        'interviewed' => 'Interviewed',
                        'offer_received' => 'Offer Received',
                        'accepted' => 'Accepted',
                        'visa_processing' => 'Visa Processing',
                        'visa_approved' => 'Visa Approved',
                        'visa_rejected' => 'Visa Rejected',
                        'enrolled' => 'Enrolled',
                        'closed' => 'Closed',
                        'on_hold' => 'On Hold',
                    ])->required(),
            ])->columns(2),

            Forms\Components\Section::make('Assignment')->schema([
                Forms\Components\Select::make('source_agency_id')
                    ->label('Source Agency')
                    ->relationship('sourceAgency', 'name')
                    ->searchable()->nullable(),
                Forms\Components\Select::make('assigned_agency_id')
                    ->label('Assigned Agency')
                    ->relationship('assignedAgency', 'name')
                    ->searchable()->nullable(),
                Forms\Components\Select::make('assigned_institution_id')
                    ->label('Assigned Institution')
                    ->relationship('assignedInstitution', 'name')
                    ->searchable()->nullable(),
            ])->columns(3),

            Forms\Components\Section::make('Target')->schema([
                Forms\Components\TextInput::make('target_country')->default('Japan'),
                Forms\Components\TextInput::make('target_course'),
                Forms\Components\DatePicker::make('target_intake'),
            ])->columns(3),

            Forms\Components\Section::make('Lead Sharing')->schema([
                Forms\Components\Toggle::make('is_published')->label('Published to Open Pool'),
                Forms\Components\Toggle::make('is_locked')->label('Locked'),
                Forms\Components\TextInput::make('unlock_fee')->numeric()->prefix('BDT'),
                Forms\Components\TextInput::make('referral_fee')->numeric()->prefix('BDT'),
                Forms\Components\Toggle::make('referral_fee_paid'),
            ])->columns(3),

            Forms\Components\Section::make('Notes')->schema([
                Forms\Components\Textarea::make('admin_notes')->rows(3),
                Forms\Components\Textarea::make('agency_notes')->rows(3),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('lead_code')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('student.name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('pool_type')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'open' => 'success',
                        'private' => 'warning',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'new' => 'gray',
                        'under_review' => 'info',
                        'shortlisted' => 'warning',
                        'enrolled' => 'success',
                        'visa_rejected', 'closed' => 'danger',
                        default => 'primary',
                    }),
                Tables\Columns\TextColumn::make('target_country'),
                Tables\Columns\TextColumn::make('assignedAgency.name')->label('Agency'),
                Tables\Columns\IconColumn::make('is_published')->boolean()->label('Published'),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                SelectFilter::make('pool_type')->options(['open' => 'Open Pool', 'private' => 'Private Vault']),
                SelectFilter::make('status')->options([
                    'new' => 'New', 'shortlisted' => 'Shortlisted',
                    'enrolled' => 'Enrolled', 'closed' => 'Closed',
                ]),
                SelectFilter::make('target_country')->options(['Japan' => 'Japan', 'Korea' => 'Korea']),
            ])
            ->actions([
                Tables\Actions\Action::make('publish')
                    ->label('Publish to Open Pool')
                    ->icon('heroicon-o-globe-alt')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (Lead $record) => !$record->is_published)
                    ->action(fn (Lead $record) => $record->publishToOpenPool()),
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
            'index' => Pages\ListLeads::route('/'),
            'create' => Pages\CreateLead::route('/create'),
            'edit' => Pages\EditLead::route('/{record}/edit'),
        ];
    }
}
