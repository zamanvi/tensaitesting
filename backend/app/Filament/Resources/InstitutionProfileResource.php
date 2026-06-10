<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InstitutionProfileResource\Pages;
use App\Models\InstitutionProfile;
use App\Models\TensaiNotification;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class InstitutionProfileResource extends Resource
{
    protected static ?string $model = InstitutionProfile::class;
    protected static ?string $navigationIcon = 'heroicon-o-building-library';
    protected static ?string $navigationGroup = 'Users & Gateways';
    protected static ?string $navigationLabel = 'Institutions';
    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Institution Identity')->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->disabled()
                    ->label('Owner Account'),
                Forms\Components\TextInput::make('institution_name')->required()->maxLength(255),
                Forms\Components\TextInput::make('institution_name_local')->label('Local Name'),
                Forms\Components\Select::make('institution_type')->options([
                    'university'      => 'University',
                    'college'         => 'College',
                    'language_school' => 'Language School',
                    'vocational'      => 'Vocational School',
                    'employer'        => 'Employer',
                ]),
                Forms\Components\TextInput::make('country')->required(),
                Forms\Components\TextInput::make('city')->required(),
                Forms\Components\TextInput::make('address')->label('Full Address'),
                Forms\Components\TextInput::make('website')->url(),
                Forms\Components\FileUpload::make('logo')
                    ->label('Logo')
                    ->image()
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('institution/logos')
                    ->visibility('public')
                    ->maxSize(2048)
                    ->columnSpanFull(),
            ])->columns(2),

            Forms\Components\Section::make('Programs & Requirements')
                ->schema([
                    Forms\Components\TagsInput::make('intake_months')
                        ->label('Intake Months')
                        ->placeholder('e.g. April, October')
                        ->helperText('Press Enter to add each month.'),
                    Forms\Components\TagsInput::make('accepted_qualifications')
                        ->label('Accepted Qualifications')
                        ->placeholder('e.g. N4, Bachelor'),
                    Forms\Components\KeyValue::make('required_language_scores')
                        ->label('Required Language Scores')
                        ->keyLabel('Test')
                        ->valueLabel('Min Score')
                        ->columnSpanFull(),
                ])->columns(2)->collapsible(),

            Forms\Components\Section::make('Admin Controls')
                ->description('Manage approval, commission, and status.')
                ->schema([
                    Forms\Components\Select::make('status')->options([
                        'pending'   => 'Pending',
                        'active'    => 'Active',
                        'suspended' => 'Suspended',
                    ])->required(),
                    Forms\Components\TextInput::make('commission_percent')
                        ->label('Commission %')
                        ->numeric()
                        ->minValue(0)
                        ->maxValue(100)
                        ->suffix('%'),
                    Forms\Components\DateTimePicker::make('verified_at')
                        ->label('Verified At'),
                ])->columns(3),

            Forms\Components\Section::make('Intake & Requirements')
                ->schema([
                    Forms\Components\Textarea::make('description')->rows(3)->columnSpanFull(),
                    Forms\Components\TextInput::make('tuition_fee_min')->numeric()->label('Min Fee'),
                    Forms\Components\TextInput::make('tuition_fee_max')->numeric()->label('Max Fee'),
                    Forms\Components\Select::make('currency')->options([
                        'JPY' => 'JPY', 'USD' => 'USD', 'BDT' => 'BDT', 'EUR' => 'EUR', 'KRW' => 'KRW',
                    ]),
                ])->columns(3)->collapsible(),

            Forms\Components\Section::make('Admin Notes')
                ->schema([
                    Forms\Components\Textarea::make('admin_notes')
                        ->label('Internal Notes')
                        ->rows(3)
                        ->placeholder('Internal notes visible only to admins...'),
                ])->collapsible(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Owner')
                    ->searchable()
                    ->sortable()
                    ->description(fn (InstitutionProfile $r) => $r->user?->email),

                Tables\Columns\TextColumn::make('institution_name')
                    ->searchable()
                    ->description(fn (InstitutionProfile $r) => $r->institution_name_local),

                Tables\Columns\TextColumn::make('institution_type')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'university'     => 'info',
                        'language_school'=> 'success',
                        'vocational'     => 'warning',
                        'employer'       => 'gray',
                        default          => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => ucwords(str_replace('_', ' ', $state))),

                Tables\Columns\TextColumn::make('country')
                    ->description(fn (InstitutionProfile $r) => $r->city),

                Tables\Columns\TextColumn::make('commission_percent')
                    ->label('Commission')
                    ->suffix('%')
                    ->sortable(),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'active'    => 'success',
                        'pending'   => 'warning',
                        'suspended' => 'danger',
                        default     => 'gray',
                    }),

                Tables\Columns\TextColumn::make('verified_at')
                    ->label('Verified')
                    ->dateTime()
                    ->placeholder('—')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')->options([
                    'pending'   => 'Pending Review',
                    'active'    => 'Active',
                    'suspended' => 'Suspended',
                ]),
                SelectFilter::make('institution_type')->options([
                    'university'     => 'University',
                    'college'        => 'College',
                    'language_school'=> 'Language School',
                    'vocational'     => 'Vocational',
                    'employer'       => 'Employer',
                ]),
            ])
            ->actions([
                // Approve
                Tables\Actions\Action::make('approve')
                    ->label('Approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (InstitutionProfile $r) => $r->status !== 'active')
                    ->action(function (InstitutionProfile $record) {
                        $record->update([
                            'status'      => 'active',
                            'verified_at' => now(),
                        ]);
                        // Sync user account status
                        $record->user?->update(['status' => 'active']);
                        // Send in-app notification to institution owner
                        if ($record->user_id) {
                            TensaiNotification::create([
                                'user_id' => $record->user_id,
                                'type'    => 'success',
                                'title'   => 'Your institution profile has been approved!',
                                'body'    => 'Congratulations! Your institution profile for "' . $record->institution_name . '" has been verified and approved. You now have full platform access.',
                            ]);
                        }
                        Notification::make()->title('Institution approved')->success()->send();
                    }),

                // Suspend
                Tables\Actions\Action::make('suspend')
                    ->label('Suspend')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (InstitutionProfile $r) => $r->status === 'active')
                    ->action(function (InstitutionProfile $record) {
                        $record->update(['status' => 'suspended']);
                        $record->user?->update(['status' => 'suspended']);
                        Notification::make()->title('Institution suspended')->warning()->send();
                    }),

                // Reactivate from suspended
                Tables\Actions\Action::make('reactivate')
                    ->label('Reactivate')
                    ->icon('heroicon-o-arrow-path')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->visible(fn (InstitutionProfile $r) => $r->status === 'suspended')
                    ->action(function (InstitutionProfile $record) {
                        $record->update(['status' => 'active']);
                        Notification::make()->title('Institution reactivated')->success()->send();
                    }),

                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    // Bulk approve
                    Tables\Actions\BulkAction::make('bulk_approve')
                        ->label('Approve Selected')
                        ->icon('heroicon-o-check-badge')
                        ->color('success')
                        ->requiresConfirmation()
                        ->deselectRecordsAfterCompletion()
                        ->action(function (\Illuminate\Support\Collection $records) {
                            $count = 0;
                            foreach ($records as $record) {
                                if ($record->status !== 'active') {
                                    $record->update(['status' => 'active', 'verified_at' => now()]);
                                    $count++;
                                }
                            }
                            Notification::make()->title("{$count} institution(s) approved.")->success()->send();
                        }),

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
            'index'  => Pages\ListInstitutionProfiles::route('/'),
            'create' => Pages\CreateInstitutionProfile::route('/create'),
            'edit'   => Pages\EditInstitutionProfile::route('/{record}/edit'),
        ];
    }
}
