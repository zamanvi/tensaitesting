<?php

namespace App\Filament\Resources;

use App\Filament\Resources\LeadResource\Pages;
use App\Models\Lead;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;

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
                        'new'                  => 'New',
                        'profile_complete'     => 'Profile Complete',
                        'under_review'         => 'Under Review',
                        'shortlisted'          => 'Shortlisted',
                        'interview_scheduled'  => 'Interview Scheduled',
                        'interviewed'          => 'Interviewed',
                        'offer_received'       => 'Offer Received',
                        'accepted'             => 'Accepted',
                        'visa_processing'      => 'Visa Processing',
                        'visa_approved'        => 'Visa Approved',
                        'visa_rejected'        => 'Visa Rejected',
                        'enrolled'             => 'Enrolled',
                        'closed'               => 'Closed',
                        'on_hold'              => 'On Hold',
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

            Forms\Components\Section::make('JLPT / NAT')->schema([
                Forms\Components\TextInput::make('jlpt_nat_score')
                    ->label('JLPT/NAT Score')
                    ->maxLength(50),
                Forms\Components\DatePicker::make('jlpt_nat_result_date')
                    ->label('Result Publish Date'),
                Forms\Components\DatePicker::make('expected_jlpt_nat_exam_date')
                    ->label('Expected Exam Date'),
                Forms\Components\TagsInput::make('preferred_cities')
                    ->label('Preferred Cities')
                    ->placeholder('Add city')
                    ->columnSpanFull(),
            ])->columns(3),

            Forms\Components\Section::make('Lead Sharing')->schema([
                Forms\Components\Toggle::make('is_published')->label('Published to Open Pool'),
                Forms\Components\Toggle::make('is_locked')->label('Locked'),
                Forms\Components\TextInput::make('unlock_fee')->numeric()->prefix('BDT'),
                Forms\Components\TextInput::make('referral_fee')->numeric()->prefix('BDT'),
                Forms\Components\Toggle::make('referral_fee_paid'),
                Forms\Components\DateTimePicker::make('published_at')->label('Published At')->disabled(),
            ])->columns(3),

            Forms\Components\Section::make('Notes')->schema([
                Forms\Components\Textarea::make('admin_notes')->rows(3),
                Forms\Components\Textarea::make('agency_notes')->rows(3)->disabled(),
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
                        'open'    => 'success',
                        'private' => 'warning',
                        default   => 'gray',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'new'          => 'gray',
                        'under_review' => 'info',
                        'shortlisted'  => 'warning',
                        'enrolled'     => 'success',
                        'visa_rejected', 'closed' => 'danger',
                        default        => 'primary',
                    }),
                Tables\Columns\TextColumn::make('target_country'),
                Tables\Columns\TextColumn::make('sourceAgency.name')
                    ->label('Source Agency')
                    ->default('Direct')
                    ->sortable(),
                Tables\Columns\TextColumn::make('assignedAgency.name')
                    ->label('Assigned Agency')
                    ->default('—'),
                Tables\Columns\TextColumn::make('target_course')
                    ->label('Course')
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('jlpt_nat_score')
                    ->label('JLPT/NAT')
                    ->default('—')
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('preferred_cities')
                    ->label('Preferred Cities')
                    ->formatStateUsing(fn ($state) => is_array($state) ? implode(', ', $state) : ($state ?? '—'))
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('target_intake')
                    ->label('Intake')
                    ->date()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\IconColumn::make('is_published')->boolean()->label('Published'),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                SelectFilter::make('pool_type')->options(['open' => 'Open Pool', 'private' => 'Private Vault']),
                SelectFilter::make('status')->options([
                    'new'                  => 'New',
                    'profile_complete'     => 'Profile Complete',
                    'under_review'         => 'Under Review',
                    'shortlisted'          => 'Shortlisted',
                    'interview_scheduled'  => 'Interview Scheduled',
                    'interviewed'          => 'Interviewed',
                    'offer_received'       => 'Offer Received',
                    'accepted'             => 'Accepted',
                    'visa_processing'      => 'Visa Processing',
                    'visa_approved'        => 'Visa Approved',
                    'visa_rejected'        => 'Visa Rejected',
                    'enrolled'             => 'Enrolled',
                    'closed'               => 'Closed',
                    'on_hold'              => 'On Hold',
                ]),
                SelectFilter::make('source_agency_id')
                    ->label('Source Agency')
                    ->relationship('sourceAgency', 'name')
                    ->searchable(),
                SelectFilter::make('target_country')->options([
                    'Japan'       => 'Japan',
                    'South Korea' => 'South Korea',
                    'Australia'   => 'Australia',
                    'Canada'      => 'Canada',
                    'UK'          => 'UK',
                    'Germany'     => 'Germany',
                    'USA'         => 'USA',
                ]),
            ])
            ->actions([
                Tables\Actions\Action::make('change_status')
                    ->label('Status')
                    ->icon('heroicon-o-arrow-path')
                    ->color('info')
                    ->form([
                        Forms\Components\Select::make('status')
                            ->label('New Status')
                            ->options([
                                'new'                  => 'New',
                                'profile_complete'     => 'Profile Complete',
                                'under_review'         => 'Under Review',
                                'shortlisted'          => 'Shortlisted',
                                'interview_scheduled'  => 'Interview Scheduled',
                                'interviewed'          => 'Interviewed',
                                'offer_received'       => 'Offer Received',
                                'accepted'             => 'Accepted',
                                'visa_processing'      => 'Visa Processing',
                                'visa_approved'        => 'Visa Approved',
                                'visa_rejected'        => 'Visa Rejected',
                                'enrolled'             => 'Enrolled',
                                'closed'               => 'Closed',
                                'on_hold'              => 'On Hold',
                            ])
                            ->required(),
                    ])
                    ->action(function (Lead $record, array $data) {
                        $record->update(['status' => $data['status']]);
                        Notification::make()->title('Status updated')->success()->send();
                    }),
                Tables\Actions\Action::make('publish')
                    ->label('Publish')
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
            'edit'  => Pages\EditLead::route('/{record}/edit'),
        ];
    }
}
