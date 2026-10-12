<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MobilityCandidateResource\Pages;
use App\Models\CvAccess;
use App\Models\MobilityCandidate;
use Filament\Notifications\Notification;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\HtmlString;

// "Talent Passports": every skilled worker who answered the /mobility chat (or
// was added by staff at the office). Staff verify documents, attach the skill
// video link and move the candidate along; managers see it only when an admin
// ticks it for them on the Managers form, like every other section.
class MobilityCandidateResource extends Resource
{
    protected static ?string $model                = MobilityCandidate::class;
    protected static ?string $modelLabel           = 'Talent Passport';
    protected static ?string $pluralModelLabel     = 'Talent Passports';
    protected static ?string $navigationIcon       = 'heroicon-o-identification';
    protected static ?string $navigationLabel      = 'Talent Passports';
    protected static ?string $navigationGroup      = 'Skilled Worker Mobility';
    protected static ?int    $navigationSort       = 2;
    protected static ?string $recordTitleAttribute = 'full_name';

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    // Number of people nobody has dealt with yet.
    public static function getNavigationBadge(): ?string
    {
        $new = MobilityCandidate::where('status', 'new')->count();

        return $new > 0 ? (string) $new : null;
    }

    // Show soft-deleted rows too, so they can be restored or erased for good.
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->withoutGlobalScopes([SoftDeletingScope::class]);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Contact')
                ->columns(2)
                ->schema([
                    Forms\Components\TextInput::make('full_name')->required()->maxLength(120),
                    Forms\Components\TextInput::make('phone')
                        ->tel()
                        ->maxLength(32)
                        // Stored in the same shape the website chat uses (digits,
                        // optional leading +), so one person is never two records.
                        ->dehydrateStateUsing(fn ($state) => preg_replace('/[\s\-().]+/', '', (string) $state))
                        ->rule('regex:/^\+?[0-9\s\-().]{8,20}$/')
                        ->unique(ignoreRecord: true)
                        ->helperText('8 to 15 digits, with an optional leading +.'),
                    Forms\Components\Toggle::make('phone_consent')
                        ->label('Agreed to be contacted on this number'),
                    Forms\Components\DateTimePicker::make('consented_at')
                        ->disabled()
                        ->dehydrated(false)
                        ->timezone('Asia/Dhaka'),
                    Forms\Components\TextInput::make('code')
                        ->label('Reference code')
                        ->disabled()
                        ->dehydrated(false)
                        ->visibleOn('edit')
                        ->helperText('The code the candidate was shown. Also used in the Talent Passport link.'),
                ]),

            Forms\Components\Section::make('Chat answers')
                ->columns(2)
                ->schema([
                    Forms\Components\TextInput::make('role')->maxLength(120),
                    Forms\Components\TextInput::make('experience')->maxLength(80),
                    Forms\Components\TextInput::make('licence')
                        ->label('Licence / qualification')
                        ->maxLength(160),
                    Forms\Components\TextInput::make('languages')->maxLength(160),
                    Forms\Components\TextInput::make('target_country')->maxLength(80),
                    Forms\Components\TextInput::make('district')->maxLength(80),
                    Forms\Components\Toggle::make('has_passport')
                        ->label('Holds a valid passport')
                        ->helperText('As answered in the chat. The passport number is never collected.'),
                    Forms\Components\Toggle::make('can_visit_office')
                        ->label('Can visit the Dhaka or Pabna office'),
                    Forms\Components\Select::make('lang')
                        ->label('Chat language')
                        ->options(['bn' => 'Bangla', 'en' => 'English', 'ja' => 'Japanese']),
                    Forms\Components\Placeholder::make('transcript')
                        ->label('Full transcript')
                        ->columnSpanFull()
                        ->visibleOn('edit')
                        ->content(function (?MobilityCandidate $record) {
                            $rows = collect($record?->answers ?? [])->map(
                                fn ($a) => '<div style="margin-bottom:6px"><strong>' . e($a['question'] ?? '') . '</strong><br>' . e($a['answer'] ?? '') . '</div>'
                            );

                            return new HtmlString($rows->isEmpty() ? '—' : $rows->implode(''));
                        }),
                ]),

            Forms\Components\Section::make('Staff')
                ->columns(2)
                ->schema([
                    Forms\Components\Select::make('status')
                        ->options(MobilityCandidate::STATUSES)
                        ->default('new')
                        ->required()
                        ->native(false),
                    Forms\Components\Select::make('branch_id')
                        ->label('Branch')
                        ->relationship('branch', 'name')
                        ->searchable()
                        ->preload()
                        ->placeholder('Not assigned'),
                    Forms\Components\TextInput::make('video_url')
                        ->label('Skill video (YouTube unlisted link)')
                        ->url()
                        // It will be embedded on the public Talent Passport, so
                        // only a YouTube link is accepted.
                        ->rule('regex:#^https://(www\.|m\.)?(youtube\.com/(watch\?v=|embed/|shorts/)|youtu\.be/)[A-Za-z0-9_\-]{6,}#')
                        ->validationMessages(['regex' => 'Use a YouTube link (youtube.com/watch?v=… or youtu.be/…).'])
                        ->maxLength(500)
                        ->columnSpanFull(),
                    Forms\Components\Textarea::make('summary')
                        ->label('English summary')
                        ->rows(3)
                        ->columnSpanFull(),
                    Forms\Components\Toggle::make('passport_published')
                        ->label('Talent Passport is ready to share'),
                    Forms\Components\Select::make('source')
                        ->options(['chat' => 'Website chat', 'office' => 'Added at the office'])
                        ->default('office'),
                    Forms\Components\Textarea::make('admin_notes')
                        ->label('Internal notes')
                        ->rows(3)
                        ->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('code')
                    ->label('Ref')
                    ->searchable()
                    ->copyable()
                    ->fontFamily('mono'),

                Tables\Columns\TextColumn::make('full_name')
                    ->label('Name')
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('phone')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('role')->searchable()->toggleable(),
                Tables\Columns\TextColumn::make('experience')->toggleable(),
                Tables\Columns\TextColumn::make('target_country')->label('Country')->toggleable(),
                Tables\Columns\TextColumn::make('district')->searchable()->toggleable(),

                Tables\Columns\IconColumn::make('has_passport')
                    ->label('Passport?')
                    ->boolean()
                    ->toggleable(),
                Tables\Columns\IconColumn::make('can_visit_office')
                    ->label('Can visit?')
                    ->boolean()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => MobilityCandidate::STATUSES[$state] ?? $state)
                    ->color(fn (string $state) => match ($state) {
                        'new'            => 'warning',
                        'contacted'      => 'info',
                        'verified'       => 'primary',
                        'passport_ready' => 'success',
                        default          => 'gray',
                    }),

                Tables\Columns\IconColumn::make('passport_published')
                    ->label('Passport')
                    ->boolean(),

                // Is this person also a website account, and has staff opened
                // their My CV yet? Matched on phone number.
                Tables\Columns\TextColumn::make('account')
                    ->label('Account')
                    ->badge()
                    ->getStateUsing(function (MobilityCandidate $record) {
                        $access = $record->cvAccess;
                        if ($access) {
                            return $access->isActive()
                                ? 'CV: ' . strtolower(CvAccess::STAGES[$access->stage()])
                                : 'CV paused';
                        }

                        return CvAccess::findUserFor($record) ? 'Has account' : 'No account';
                    })
                    ->color(fn (string $state) => match (true) {
                        str_starts_with($state, 'CV: sent')   => 'success',
                        str_starts_with($state, 'CV: ready')  => 'warning',
                        str_starts_with($state, 'CV')         => 'primary',
                        $state === 'Has account'              => 'info',
                        default                               => 'gray',
                    }),

                Tables\Columns\TextColumn::make('branch.name')->label('Branch')->toggleable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Received')
                    ->since()
                    ->tooltip(fn (MobilityCandidate $record) => $record->created_at
                        ?->setTimezone('Asia/Dhaka')
                        ->format('d M Y, h:i A') . ' (Dhaka)')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')->options(MobilityCandidate::STATUSES),
                Tables\Filters\SelectFilter::make('branch_id')
                    ->label('Branch')
                    ->relationship('branch', 'name'),
                // People who can both hold a visa process and come in: call these first.
                Tables\Filters\Filter::make('ready')
                    ->label('Ready to visit (has passport and can come in)')
                    ->query(fn (Builder $query) => $query->where('has_passport', true)->where('can_visit_office', true)),
                // Who has a website account? Free accounts exist for everyone;
                // "CV open" means staff switched My CV (and its assistant) on.
                Tables\Filters\SelectFilter::make('account')
                    ->label('Account')
                    ->options([
                        'none'     => 'No account (chat only)',
                        'account'  => 'Has account (CV not open)',
                        'cv_open'  => 'CV open',
                    ])
                    ->query(function (Builder $query, array $data) {
                        $has = 'EXISTS (SELECT 1 FROM users u WHERE u.deleted_at IS NULL AND u.gateway_type = \'student\''
                            . ' AND u.phone IS NOT NULL AND CHAR_LENGTH(mobility_candidates.phone) >= 8'
                            . ' AND RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(u.phone, \' \', \'\'), \'-\', \'\'), \'+\', \'\'), \'(\', \'\'), 10)'
                            . ' = RIGHT(mobility_candidates.phone, 10))';

                        return match ($data['value'] ?? null) {
                            'cv_open' => $query->whereHas('cvAccess', fn ($q) => $q->where('status', 'active')),
                            'account' => $query->whereDoesntHave('cvAccess', fn ($q) => $q->where('status', 'active'))->whereRaw($has),
                            'none'    => $query->whereDoesntHave('cvAccess')->whereRaw('NOT ' . $has),
                            default   => $query,
                        };
                    }),
                Tables\Filters\SelectFilter::make('cv_stage')
                    ->label('CV stage')
                    ->options(CvAccess::STAGES)
                    ->query(function (Builder $query, array $data) {
                        return match ($data['value'] ?? null) {
                            'filling' => $query->whereHas('cvAccess', fn ($q) => $q->where('status', 'active')->whereNull('cv_submitted_at')->whereNull('sent_at')),
                            'review'  => $query->whereHas('cvAccess', fn ($q) => $q->where('status', 'active')->whereNotNull('cv_submitted_at')->whereNull('sent_at')),
                            'sent'    => $query->whereHas('cvAccess', fn ($q) => $q->whereNotNull('sent_at')),
                            default   => $query,
                        };
                    }),
                Tables\Filters\TernaryFilter::make('passport_published')->label('Passport ready'),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('activate_cv')
                    ->label('Activate CV')
                    ->icon('heroicon-o-document-plus')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Open My CV for this person?')
                    ->modalDescription('Their chat answers are copied into a draft Job CV, which then appears in All Applications.')
                    ->visible(function (MobilityCandidate $record) {
                        if ($record->trashed() || ! CvAccessResource::canAccess()) {
                            return false;
                        }
                        $user = CvAccess::findUserFor($record);

                        return $user
                            && ! CvAccess::where('user_id', $user->id)->where('status', 'active')->exists();
                    })
                    ->action(function (MobilityCandidate $record) {
                        $user = CvAccess::findUserFor($record);
                        if (! $user) {
                            return;
                        }
                        CvAccess::activateFor($user, auth()->user());

                        Notification::make()->title('My CV opened for ' . $user->name)->success()->send();
                    }),
                Tables\Actions\Action::make('open_cv')
                    ->label('Open CV')
                    ->icon('heroicon-o-arrow-top-right-on-square')
                    ->visible(fn (MobilityCandidate $record) => (bool) $record->cvAccess?->application_id
                        && ApplicationResource::canAccess())
                    ->url(fn (MobilityCandidate $record) => ApplicationResource::getUrl('edit', ['record' => $record->cvAccess->application_id])),
                Tables\Actions\Action::make('cv_settings')
                    ->label('CV settings')
                    ->icon('heroicon-o-cog-6-tooth')
                    ->visible(fn (MobilityCandidate $record) => (bool) $record->cvAccess && CvAccessResource::canAccess())
                    ->url(fn (MobilityCandidate $record) => CvAccessResource::getUrl('edit', ['record' => $record->cvAccess->getKey()])),
                // The last staff step: the checked CV joins All Applications.
                Tables\Actions\Action::make('send_to_applications')
                    ->label('Send to All Applications')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('primary')
                    ->requiresConfirmation()
                    ->modalHeading('Send this CV to All Applications?')
                    ->modalDescription('Check that the details are correct first. The CV will then appear in All Applications as a submitted application. It is not shown to employers by this step.')
                    ->visible(fn (MobilityCandidate $record) => ! $record->trashed()
                        && $record->cvAccess?->isActive()
                        && ! $record->cvAccess->sent_at
                        && CvAccessResource::canAccess())
                    ->action(function (MobilityCandidate $record) {
                        $record->cvAccess?->sendToApplications();

                        Notification::make()->title('CV sent to All Applications')->success()->send();
                    }),
                Tables\Actions\RestoreAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListMobilityCandidates::route('/'),
            'create' => Pages\CreateMobilityCandidate::route('/create'),
            'edit'   => Pages\EditMobilityCandidate::route('/{record}/edit'),
        ];
    }
}
