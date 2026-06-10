<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AgencyProfileResource\Pages;
use App\Models\AgencyProfile;
use App\Models\TensaiNotification;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AgencyProfileResource extends Resource
{
    protected static ?string $model = AgencyProfile::class;
    protected static ?string $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $navigationGroup = 'Users & Gateways';
    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Agency Details')->schema([
                Forms\Components\TextInput::make('agency_name')->required()->maxLength(255),
                Forms\Components\TextInput::make('agency_name_bn')->label('Agency Name (Bangla)'),
                Forms\Components\TextInput::make('registration_number'),
                Forms\Components\TextInput::make('trade_license'),
                Forms\Components\TextInput::make('contact_person_name'),
                Forms\Components\TextInput::make('contact_person_phone'),
                Forms\Components\Textarea::make('description')
                    ->label('Agency Description')
                    ->rows(3)
                    ->columnSpanFull(),
                Forms\Components\FileUpload::make('logo')
                    ->label('Agency Logo')
                    ->image()
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('agency/logos')
                    ->visibility('public')
                    ->maxSize(2048)
                    ->columnSpanFull(),
                Forms\Components\FileUpload::make('trade_license_document')
                    ->label('Trade License Document')
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('agency/documents')
                    ->visibility('private')
                    ->maxSize(5120)
                    ->columnSpanFull(),
                Forms\Components\TagsInput::make('target_countries')
                    ->label('Target Countries')
                    ->placeholder('e.g. Japan, Korea'),
                Forms\Components\TagsInput::make('service_types')
                    ->label('Service Types')
                    ->placeholder('e.g. Language School, University'),
            ])->columns(2),

            Forms\Components\Section::make('Location & Web')->schema([
                Forms\Components\TextInput::make('address'),
                Forms\Components\TextInput::make('city'),
                Forms\Components\TextInput::make('website'),
            ])->columns(3),

            Forms\Components\Section::make('Vetting')->schema([
                Forms\Components\Select::make('vetting_status')
                    ->options([
                        'pending'      => 'Pending',
                        'under_review' => 'Under Review',
                        'approved'     => 'Approved',
                        'rejected'     => 'Rejected',
                    ])->required(),
                Forms\Components\TextInput::make('slot_number')->numeric()->disabled(),
                Forms\Components\Textarea::make('rejection_reason')->rows(3),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('agency_name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('user.name')->label('Owner')->searchable(),
                Tables\Columns\TextColumn::make('vetting_status')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'approved' => 'success',
                        'pending' => 'warning',
                        'rejected' => 'danger',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('slot_number')->label('Slot #')->sortable(),
                Tables\Columns\TextColumn::make('city'),
                Tables\Columns\TextColumn::make('approved_at')->dateTime()->sortable(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('vetting_status')
                    ->options(['pending' => 'Pending', 'under_review' => 'Under Review', 'approved' => 'Approved', 'rejected' => 'Rejected']),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->label('Approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (AgencyProfile $record) => $record->vetting_status !== 'approved')
                    ->action(function (AgencyProfile $record) {
                        $nextSlot = AgencyProfile::where('vetting_status', 'approved')->max('slot_number') + 1;
                        $record->update([
                            'vetting_status'   => 'approved',
                            'slot_number'      => $nextSlot,
                            'approved_at'      => now(),
                            'approved_by'      => auth()->id(),
                            'rejection_reason' => null,
                        ]);
                        $record->user->update(['status' => 'active']);
                        TensaiNotification::create([
                            'user_id' => $record->user_id,
                            'type' => 'agency_approved',
                            'title' => 'Agency Approved',
                            'body' => 'Your agency has been verified and approved.',
                            'data' => ['slot_number' => $nextSlot],
                            'action_url' => '/dashboard/agency',
                        ]);
                        Notification::make()->title('Agency approved')->success()->send();
                    }),

                Tables\Actions\Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn (AgencyProfile $record) => $record->vetting_status !== 'rejected')
                    ->form([
                        Forms\Components\Textarea::make('rejection_reason')
                            ->label('Rejection Reason')
                            ->required()
                            ->rows(3),
                    ])
                    ->action(function (AgencyProfile $record, array $data) {
                        $record->update([
                            'vetting_status' => 'rejected',
                            'rejection_reason' => $data['rejection_reason'],
                        ]);
                        $record->user->update(['status' => 'suspended']);
                        TensaiNotification::create([
                            'user_id' => $record->user_id,
                            'type' => 'agency_rejected',
                            'title' => 'Agency Application Rejected',
                            'body' => 'Reason: ' . $data['rejection_reason'],
                            'data' => ['reason' => $data['rejection_reason']],
                            'action_url' => '/dashboard/agency',
                        ]);
                        Notification::make()->title('Agency rejected')->danger()->send();
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
            'index' => Pages\ListAgencyProfiles::route('/'),
            'create' => Pages\CreateAgencyProfile::route('/create'),
            'edit' => Pages\EditAgencyProfile::route('/{record}/edit'),
        ];
    }
}
