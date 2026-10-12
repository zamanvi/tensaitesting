<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MobilityCandidateResource\Pages;
use App\Models\MobilityCandidate;
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
                Tables\Filters\TernaryFilter::make('passport_published')->label('Passport ready'),
                Tables\Filters\TrashedFilter::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
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
