<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CvAccessResource\Pages;
use App\Models\CvAccess;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

// "CV Access": the accounts whose My CV section staff have opened (the manual
// "premium open"). Opening one also creates the person's draft "Job CV"
// application (the CV record). Free accounts that were
// never opened simply do not appear here. Managers see it only when an admin
// ticks it for them on the Managers form, like every other section.
class CvAccessResource extends Resource
{
    protected static ?string $model                = CvAccess::class;
    protected static ?string $modelLabel           = 'CV Access';
    protected static ?string $pluralModelLabel     = 'CV Access';
    protected static ?string $navigationIcon       = 'heroicon-o-document-text';
    protected static ?string $navigationLabel      = 'CV Access';
    protected static ?string $navigationGroup      = 'Skilled Professional Mobility';
    protected static ?int    $navigationSort       = 3;

    // Staff work from Skilled Professionals (Account / CV stage filters and the
    // Activate / Send buttons); this page is reached from there for the
    // assistant limit, share link and notes, so it has no sidebar entry.
    public static function shouldRegisterNavigation(): bool
    {
        return false;
    }

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    // Free accounts to choose from when opening My CV (name, e-mail or phone).
    public static function searchStudents(string $search): array
    {
        $like = '%' . $search . '%';

        return User::where('gateway_type', 'student')
            ->where(fn ($q) => $q->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->orWhere('phone', 'like', $like))
            ->orderBy('name')
            ->limit(30)
            ->get()
            ->mapWithKeys(fn (User $u) => [$u->id => $u->name . ' — ' . ($u->phone ?: $u->email)])
            ->all();
    }

    public static function studentLabel($value): ?string
    {
        $u = User::find($value);

        return $u ? $u->name . ' — ' . ($u->phone ?: $u->email) : null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Account')
                ->columns(2)
                ->schema([
                    Forms\Components\Select::make('user_id')
                        ->label('Account')
                        ->searchable()
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->getSearchResultsUsing(fn (string $search) => static::searchStudents($search))
                        ->getOptionLabelUsing(fn ($value) => static::studentLabel($value))
                        ->disabledOn('edit')
                        ->helperText('Search by name, e-mail or phone. Saving opens My CV for this person and creates their draft Job CV.')
                        ->columnSpanFull(),
                    Forms\Components\Select::make('status')
                        ->options(CvAccess::STATUSES)
                        ->default('active')
                        ->required()
                        ->native(false)
                        ->helperText('Paused hides the CV builder from the person; nothing is deleted.'),
                    Forms\Components\TextInput::make('ai_messages_limit')
                        ->label('Assistant message limit')
                        ->numeric()
                        ->minValue(0)
                        ->maxValue(2000)
                        ->default(150)
                        ->required(),
                    Forms\Components\TextInput::make('ai_messages_used')
                        ->label('Assistant messages used')
                        ->numeric()
                        ->disabled()
                        ->dehydrated(false)
                        ->visibleOn('edit'),
                ]),

            Forms\Components\Section::make('Share link')
                ->description('A link staff can send to an employer or partner. It shows the CV with a short name (for example "Rahim U."), the reference code, and an age instead of the date of birth. No phone number, e-mail or address: contact always goes through Tensai.')
                ->columns(2)
                ->visibleOn('edit')
                ->schema([
                    Forms\Components\Toggle::make('public_enabled')
                        ->label('Shareable CV link is on')
                        ->disabled(fn (?CvAccess $record) => ! $record?->canShare())
                        ->helperText(fn (?CvAccess $record) => $record?->canShare()
                            ? 'Anyone who has the link can read the CV. Turn it off to stop sharing at once.'
                            : 'Cannot be switched on yet: the person has not agreed to share their CV (they tick this when they send it for review).'),
                    Forms\Components\Placeholder::make('public_link')
                        ->label('Link')
                        ->content(fn (?CvAccess $record) => $record?->publicUrl()
                            ?? 'Created the first time the link is switched on.'),
                ]),

            Forms\Components\Section::make('Staff')
                ->schema([
                    Forms\Components\Textarea::make('admin_notes')
                        ->label('Internal notes')
                        ->helperText('For example: how and when the CV fee was received. Never shown to the person.')
                        ->rows(3),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->label('Name')->searchable()->weight('bold'),
                Tables\Columns\TextColumn::make('user.phone')->label('Phone')->searchable()->copyable(),
                Tables\Columns\TextColumn::make('user.email')->label('E-mail')->searchable()->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => CvAccess::STATUSES[$state] ?? $state)
                    ->color(fn (string $state) => $state === 'active' ? 'success' : 'gray'),

                Tables\Columns\TextColumn::make('application.progress')
                    ->label('CV filled')
                    ->suffix('%')
                    ->placeholder('—'),
                Tables\Columns\TextColumn::make('stage')
                    ->label('CV stage')
                    ->badge()
                    ->getStateUsing(fn (CvAccess $record) => CvAccess::STAGES[$record->stage()])
                    ->color(fn (string $state) => match ($state) {
                        CvAccess::STAGES['sent']   => 'success',
                        CvAccess::STAGES['review'] => 'warning',
                        default                    => 'gray',
                    }),

                Tables\Columns\TextColumn::make('candidate.code')
                    ->label('Skilled professional')
                    ->fontFamily('mono')
                    ->placeholder('Not in chat'),

                Tables\Columns\TextColumn::make('ai_messages_used')
                    ->label('Assistant')
                    ->formatStateUsing(fn ($state, CvAccess $record) => $state . ' / ' . $record->ai_messages_limit),

                Tables\Columns\IconColumn::make('public_enabled')->label('Link on')->boolean(),

                Tables\Columns\TextColumn::make('activated_at')
                    ->label('Opened')
                    ->since()
                    ->tooltip(fn (CvAccess $record) => $record->activated_at
                        ?->setTimezone('Asia/Dhaka')
                        ->format('d M Y, h:i A') . ' (Dhaka)')
                    ->sortable(),
            ])
            ->defaultSort('activated_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')->options(CvAccess::STATUSES),
            ])
            ->actions([
                Tables\Actions\Action::make('open_cv')
                    ->label('Open CV')
                    ->icon('heroicon-o-arrow-top-right-on-square')
                    ->visible(fn (CvAccess $record) => (bool) $record->application_id
                        && ApplicationResource::canAccess())
                    ->url(fn (CvAccess $record) => ApplicationResource::getUrl('edit', ['record' => $record->application_id])),
                Tables\Actions\Action::make('approve_cv')
                    ->label('Approve CV')
                    ->icon('heroicon-o-paper-airplane')
                    ->requiresConfirmation()
                    ->modalDescription('Check that the details are correct first. The CV is then listed in Approved CVs. It is not shown to employers by this step.')
                    ->visible(fn (CvAccess $record) => $record->isActive() && ! $record->sent_at)
                    ->action(fn (CvAccess $record) => $record->approve()),
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListCvAccesses::route('/'),
            'create' => Pages\CreateCvAccess::route('/create'),
            'edit'   => Pages\EditCvAccess::route('/{record}/edit'),
        ];
    }
}
