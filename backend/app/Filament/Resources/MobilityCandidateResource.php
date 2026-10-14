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

    // People who need staff: new leads nobody has dealt with, plus CVs the
    // person has finished and sent for review.
    public static function needsAttention(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q->where('status', 'new')
            ->orWhereHas('cvAccess', fn ($c) => $c->where('status', 'active')
                ->whereNotNull('cv_submitted_at')
                ->whereNull('sent_at')));
    }

    public static function getNavigationBadge(): ?string
    {
        $count = static::needsAttention(MobilityCandidate::query())->count();

        return $count > 0 ? (string) $count : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
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
                    Forms\Components\TextInput::make('email')
                        ->email()
                        ->maxLength(190)
                        ->dehydrateStateUsing(fn ($state) => \App\Models\CvAccess::normaliseEmail($state))
                        ->helperText('Optional. Used only to recognise the same person as a website account. Never shown to employers.'),
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
                        ->label('Internal notes and job leads')
                        ->helperText('Never shown to the candidate. Paste the job circulars you checked here, with the date and link.')
                        ->rows(5)
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
                // their My CV yet? Matched on phone number or e-mail.
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
                Tables\Filters\Filter::make('attention')
                    ->label('Needs attention (new, or CV waiting for review)')
                    ->query(fn (Builder $query) => static::needsAttention($query)),
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
                            . ' AND ((u.phone IS NOT NULL AND CHAR_LENGTH(mobility_candidates.phone) >= 8'
                            . ' AND RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(u.phone, \' \', \'\'), \'-\', \'\'), \'+\', \'\'), \'(\', \'\'), 10)'
                            . ' = RIGHT(mobility_candidates.phone, 10))'
                            . ' OR (mobility_candidates.email IS NOT NULL AND mobility_candidates.email <> \'\''
                            . ' AND LOWER(TRIM(u.email)) = LOWER(TRIM(mobility_candidates.email)))))';

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
                // The other direction: staff start from the lead and say which
                // account is the same person. One person, one record.
                Tables\Actions\Action::make('link_account')
                    ->label('Link to account')
                    ->icon('heroicon-o-link')
                    ->color('success')
                    ->modalHeading('Link this lead to an account and open My CV')
                    ->modalDescription('Use this when the person has an account but neither the phone number nor the e-mail matches. Their chat answers are copied into the CV and no second entry is made.')
                    ->visible(fn (MobilityCandidate $record) => ! $record->trashed()
                        && ! $record->cvAccess
                        && CvAccessResource::canAccess())
                    ->form([
                        Forms\Components\Select::make('user_id')
                            ->label('Account')
                            ->required()
                            ->searchable()
                            ->getSearchResultsUsing(fn (string $search) => CvAccessResource::searchStudents($search))
                            ->getOptionLabelUsing(fn ($value) => CvAccessResource::studentLabel($value))
                            ->helperText('Search by name, e-mail or phone.'),
                    ])
                    ->modalSubmitActionLabel('Link and open My CV')
                    ->action(function (MobilityCandidate $record, array $data) {
                        $user = \App\Models\User::where('gateway_type', 'student')->find($data['user_id']);
                        if (! $user) {
                            Notification::make()->title('Account not found')->danger()->send();

                            return;
                        }

                        try {
                            CvAccess::activateFor($user, auth()->user(), $record);
                        } catch (\InvalidArgumentException $e) {
                            Notification::make()->title('Could not link')->body($e->getMessage())->danger()->send();

                            return;
                        }

                        Notification::make()->title('My CV opened for ' . $user->name)->success()->send();
                    }),
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
                // The instructions + this candidate's CV as plain text, to paste
                // into an AI chat when searching for job circulars. Contact
                // details are never part of it.
                Tables\Actions\Action::make('copy_for_ai')
                    ->label('Copy for AI')
                    ->icon('heroicon-o-clipboard-document')
                    ->visible(fn (MobilityCandidate $record) => ! $record->trashed())
                    ->modalHeading('Copy for AI')
                    ->modalDescription(static::aiPackDescription())
                    ->form(static::aiPackForm())
                    ->fillForm(fn (MobilityCandidate $record) => [
                        'pack' => \App\Support\JobSearchPack::build(collect([$record])),
                    ])
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close'),
                // Exactly what the person sees in My CV → Preview.
                Tables\Actions\Action::make('preview_cv')
                    ->label('Preview CV')
                    ->icon('heroicon-o-eye')
                    ->visible(fn (MobilityCandidate $record) => (bool) $record->cvAccess?->application_id)
                    ->modalHeading('CV preview')
                    ->modalContent(fn (MobilityCandidate $record) => view('filament.cv-preview', [
                        'preview' => \App\Support\CvPreview::build($record->cvAccess->load(['application', 'candidate'])),
                    ]))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close'),
                // Light editing page: the CV questions in one form, plus the
                // English summary. Use this to perfect a CV before sending it.
                Tables\Actions\Action::make('edit_cv')
                    ->label('Edit CV')
                    ->icon('heroicon-o-pencil-square')
                    ->color('primary')
                    ->visible(fn (MobilityCandidate $record) => ! $record->trashed()
                        && (bool) $record->cvAccess?->application_id
                        && CvAccessResource::canAccess())
                    ->slideOver()
                    ->modalWidth('3xl')
                    ->modalHeading('Edit CV')
                    ->modalDescription('Change anything the person answered. Empty a box to remove that answer. Changes show at once in the person\'s My CV and in the preview.')
                    ->form(fn (MobilityCandidate $record) => \App\Filament\Support\CvEditForm::schema($record->cvAccess->load(['application', 'candidate'])))
                    ->fillForm(fn (MobilityCandidate $record) => \App\Filament\Support\CvEditForm::values($record->cvAccess->load(['application', 'candidate'])))
                    ->modalSubmitActionLabel('Save CV')
                    ->action(function (MobilityCandidate $record, array $data) {
                        \App\Filament\Support\CvEditForm::save($record->cvAccess->load(['application', 'candidate']), $data);

                        Notification::make()->title('CV saved')->success()->send();
                    }),
                Tables\Actions\Action::make('open_cv')
                    ->label('Full application')
                    ->icon('heroicon-o-arrow-top-right-on-square')
                    ->visible(fn (MobilityCandidate $record) => (bool) $record->cvAccess?->application_id
                        && ApplicationResource::canAccess())
                    ->url(fn (MobilityCandidate $record) => ApplicationResource::getUrl('edit', ['record' => $record->cvAccess->application_id])),
                // Switch the shareable CV link on/off and copy it. Only after
                // the person agreed to share (ticked on "send for review").
                Tables\Actions\Action::make('share_link')
                    ->label('Share link')
                    ->icon('heroicon-o-link')
                    ->modalHeading('Shareable CV link')
                    ->modalDescription('Shows the CV with a short name, the reference code and an age, never the phone number or e-mail. Employers contact Tensai, quoting the reference.')
                    ->visible(fn (MobilityCandidate $record) => ! $record->trashed()
                        && $record->cvAccess?->canShare()
                        && CvAccessResource::canAccess())
                    ->fillForm(fn (MobilityCandidate $record) => [
                        'public_enabled' => (bool) $record->cvAccess->public_enabled,
                        'url'            => $record->cvAccess->publicUrl() ?? '',
                    ])
                    ->form([
                        Forms\Components\Toggle::make('public_enabled')->label('Link is on'),
                        Forms\Components\TextInput::make('url')
                            ->label('Link')
                            ->readOnly()
                            ->dehydrated(false)
                            // Clicking the box selects the link and copies it.
                            ->extraInputAttributes(['onclick' => 'this.select(); navigator.clipboard && navigator.clipboard.writeText(this.value);'])
                            ->helperText('Click the link to copy it.')
                            ->placeholder('Switch the link on and save to create it'),
                    ])
                    ->modalSubmitActionLabel('Save')
                    ->action(function (MobilityCandidate $record, array $data) {
                        $access = $record->cvAccess;
                        if (! $access || ! $access->canShare()) {
                            return;
                        }

                        $access->public_enabled = (bool) ($data['public_enabled'] ?? false);
                        $access->save();

                        if ($access->public_enabled) {
                            Notification::make()
                                ->title('Link is on')
                                ->body($access->ensureToken() ? $access->publicUrl() : '')
                                ->success()
                                ->persistent()
                                ->send();
                        } else {
                            Notification::make()->title('Link is off')->success()->send();
                        }
                    }),
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
                    // Several CVs in one pack: one search can serve candidates
                    // with the same kind of job.
                    Tables\Actions\BulkAction::make('copy_for_ai')
                        ->label('Copy for AI (selected)')
                        ->icon('heroicon-o-clipboard-document')
                        ->modalHeading('Copy for AI')
                        ->modalDescription(static::aiPackDescription() . ' At most ' . \App\Support\JobSearchPack::MAX_CANDIDATES . ' candidates go into one pack.')
                        ->form(static::aiPackForm())
                        ->fillForm(fn (\Illuminate\Support\Collection $records) => [
                            'pack' => \App\Support\JobSearchPack::build($records),
                        ])
                        ->modalSubmitAction(false)
                        ->modalCancelActionLabel('Close')
                        ->deselectRecordsAfterCompletion(),
                    Tables\Actions\DeleteBulkAction::make(),
                    Tables\Actions\RestoreBulkAction::make(),
                    Tables\Actions\ForceDeleteBulkAction::make(),
                ]),
            ]);
    }

    private static function aiPackDescription(): string
    {
        return 'Click the box, then paste everything into an AI chat. It contains the standing instructions (edit them in Site Settings) and the CV with a short name, the reference code and an age: no phone number or e-mail.';
    }

    // One read-only box; clicking it selects and copies the whole text.
    private static function aiPackForm(): array
    {
        return [
            Forms\Components\Textarea::make('pack')
                ->hiddenLabel()
                ->rows(18)
                ->readOnly()
                ->dehydrated(false)
                ->extraInputAttributes([
                    'onclick' => 'this.select(); navigator.clipboard && navigator.clipboard.writeText(this.value);',
                    'style'   => 'font-family: ui-monospace, monospace; font-size: 12px;',
                ])
                ->helperText('Click inside the box to copy. When the AI has found circulars, check every link yourself, then paste the useful ones into the candidate\'s internal notes.'),
        ];
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
