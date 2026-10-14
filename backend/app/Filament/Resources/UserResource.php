<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\CvAccess;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Spatie\Permission\Models\Role;

class UserResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $navigationGroup = 'Users & Gateways';
    protected static ?int $navigationSort = 1;

    public static function canAccess(): bool
    {
        // See ManagerResource::canAccess() — the nullsafe call alone can
        // return null (no authenticated user), which violates `: bool`
        // and throws a 500 instead of a plain login redirect.
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Account')->schema([
                Forms\Components\TextInput::make('name')->required()->maxLength(255),
                Forms\Components\TextInput::make('email')->email()->required()->unique(ignoreRecord: true),
                Forms\Components\TextInput::make('phone'),
                Forms\Components\TextInput::make('password')
                    ->password()
                    ->dehydrateStateUsing(fn ($state) => filled($state) ? bcrypt($state) : null)
                    ->dehydrated(fn ($state) => filled($state))
                    ->required(fn (string $context) => $context === 'create'),
            ])->columns(2),

            Forms\Components\Section::make('Profile')->schema([
                Forms\Components\Select::make('gateway_type')
                    ->options([
                        'student'     => 'Student',
                        'agency'      => 'Agency',
                        'institution' => 'Institution',
                        'affiliate'   => 'Affiliate',
                        'admin'       => 'Admin',
                    ])->required(),
                Forms\Components\Select::make('status')
                    ->options([
                        'active'    => 'Active',
                        'pending'   => 'Pending',
                        'suspended' => 'Suspended',
                    ])->required(),
                Forms\Components\Select::make('roles')
                    ->label('Role')
                    ->relationship('roles', 'name')
                    ->options(Role::whereIn('name', ['admin', 'super_admin', 'student', 'agency', 'institution', 'affiliate', 'manager'])->pluck('name', 'id'))
                    ->preload()
                    ->searchable()
                    ->helperText('Assign admin or super_admin to grant panel access.'),
                Forms\Components\TextInput::make('affiliate_code')->disabled(),
                Forms\Components\DateTimePicker::make('email_verified_at')
                    ->label('Email Verified At')
                    ->disabled(),
                Forms\Components\Placeholder::make('referred_by_display')
                    ->label('Referred By')
                    ->content(fn ($record) => $record?->referrer?->name ?? '—'),
            ])->columns(3),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn ($query) => $query->with('cvAccess'))
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('roles.name')
                    ->label('Role')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'super_admin' => 'danger',
                        'admin'       => 'warning',
                        default       => 'gray',
                    })
                    ->separator(','),
                Tables\Columns\TextColumn::make('email')->searchable(),
                Tables\Columns\TextColumn::make('phone'),
                Tables\Columns\TextColumn::make('gateway_type')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'student' => 'primary',
                        'agency' => 'warning',
                        'institution' => 'success',
                        'affiliate' => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'active' => 'success',
                        'pending' => 'warning',
                        'suspended' => 'danger',
                        default => 'gray',
                    }),
                // Where this person is in the AI assistant / My CV flow.
                Tables\Columns\TextColumn::make('my_cv')
                    ->label('My CV')
                    ->badge()
                    ->getStateUsing(function (User $record) {
                        if ($record->gateway_type !== 'student') {
                            return null;
                        }
                        $access = $record->cvAccess;
                        if (! $access) {
                            return 'Not opened';
                        }

                        return $access->status === 'active'
                            ? CvAccess::STAGES[$access->stage()]
                            : 'Paused';
                    })
                    ->color(fn (?string $state) => match ($state) {
                        'Filling the CV'           => 'warning',
                        'Ready for review'         => 'info',
                        'Sent to All Applications' => 'success',
                        default                    => 'gray',
                    }),
                Tables\Columns\TextColumn::make('affiliate_code')->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\IconColumn::make('email_verified_at')
                    ->label('Verified')
                    ->boolean()
                    ->getStateUsing(fn ($record) => !is_null($record->email_verified_at)),
                Tables\Columns\TextColumn::make('referrer.name')
                    ->label('Referred By')
                    ->placeholder('—')
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                SelectFilter::make('gateway_type')
                    ->options([
                        'student'     => 'Student',
                        'agency'      => 'Agency',
                        'institution' => 'Institution',
                        'affiliate'   => 'Affiliate',
                        'admin'       => 'Admin',
                    ]),
                SelectFilter::make('status')
                    ->options(['active' => 'Active', 'pending' => 'Pending', 'suspended' => 'Suspended']),
            ])
            ->actions([
                // One click for the common case: the person made a free account,
                // asked on WhatsApp, and staff agree. No other form. If the same
                // person is already in Talent Passports (same phone number or
                // same e-mail; never just the name) the account is joined to that entry, so it stays ONE
                // record; the confirmation says which one before anything happens.
                Tables\Actions\Action::make('open_my_cv')
                    ->label(fn (User $record) => $record->cvAccess ? 'Resume My CV' : 'Open My CV')
                    ->icon('heroicon-o-document-plus')
                    ->color('success')
                    ->visible(fn (User $record) => $record->gateway_type === 'student'
                        && CvAccessResource::canAccess()
                        && ($record->cvAccess?->status !== 'active'))
                    ->requiresConfirmation()
                    ->modalHeading(fn (User $record) => ($record->cvAccess ? 'Resume My CV for ' : 'Open My CV for ') . $record->name . '?')
                    ->modalDescription(function (User $record) {
                        if ($record->cvAccess) {
                            return 'Their assistant and CV were paused. They will be able to continue where they stopped.';
                        }
                        $lead = CvAccess::suggestCandidateFor($record);
                        $base = 'They get the AI assistant and a draft CV, which also appears in All Applications. ';

                        return $base . ($lead
                            ? 'Same phone number or e-mail as Talent Passports entry ' . $lead->code . ' (' . ($lead->full_name ?: 'no name') . '): the account is joined to that entry and no second row is made.'
                            : 'A new Talent Passports entry is created for them.');
                    })
                    ->modalSubmitActionLabel('Open My CV')
                    ->action(function (User $record) {
                        // Only a brand-new opening joins a lead; resuming keeps what is there.
                        $lead = $record->cvAccess ? null : CvAccess::suggestCandidateFor($record);

                        try {
                            CvAccess::activateFor($record, auth()->user(), $lead);
                        } catch (\InvalidArgumentException $e) {
                            Notification::make()->title('Could not open My CV')->body($e->getMessage())->danger()->send();

                            return;
                        }

                        Notification::make()->title('My CV opened for ' . $record->name)->success()->send();
                    }),

                Tables\Actions\Action::make('activate')
                    ->label('Activate')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (User $record) => $record->status !== 'active')
                    ->action(function (User $record) {
                        $record->update(['status' => 'active']);
                        Notification::make()->title('User activated')->success()->send();
                    }),

                Tables\Actions\Action::make('suspend')
                    ->label('Suspend')
                    ->icon('heroicon-o-no-symbol')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (User $record) => $record->status === 'active')
                    ->action(function (User $record) {
                        $record->update(['status' => 'suspended']);
                        Notification::make()->title('User suspended')->danger()->send();
                    }),

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
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
