<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AnswerLibraryItemResource\Pages;
use App\Models\AnswerLibraryItem;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

// "Answer Library": questions people ask and the answers staff have checked.
// Only VERIFIED, unexpired entries are ever shown to a user, and editing a
// verified entry sends it back to draft until someone verifies it again, so a
// wrong or stale answer cannot reach a candidate by accident.
class AnswerLibraryItemResource extends Resource
{
    protected static ?string $model                = AnswerLibraryItem::class;
    protected static ?string $modelLabel           = 'Answer';
    protected static ?string $pluralModelLabel     = 'Answer Library';
    protected static ?string $navigationIcon       = 'heroicon-o-book-open';
    protected static ?string $navigationLabel      = 'Answer Library';
    protected static ?string $navigationGroup      = 'Skilled Worker Mobility';
    protected static ?int    $navigationSort       = 4;
    protected static ?string $recordTitleAttribute = 'question_en';

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    // Entries waiting for a person to verify them.
    public static function getNavigationBadge(): ?string
    {
        $drafts = AnswerLibraryItem::where('status', 'draft')->count();

        return $drafts > 0 ? (string) $drafts : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    // Can this entry be verified now? Returns the reason it cannot, or null.
    public static function cannotVerifyBecause(AnswerLibraryItem $item): ?string
    {
        if (blank($item->answer_en)) {
            return 'The English answer is empty.';
        }
        if (blank($item->source_url) && $item->category !== 'tensai') {
            return 'Add the official page this answer is based on (Source link) before verifying.';
        }
        if ($item->valid_until && $item->valid_until->endOfDay()->isPast()) {
            return 'The "valid until" date has already passed. Update the answer and the date.';
        }

        return null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Question')
                ->columns(2)
                ->schema([
                    Forms\Components\Select::make('category')
                        ->options(AnswerLibraryItem::CATEGORIES)
                        ->required()
                        ->native(false),
                    Forms\Components\TextInput::make('slug')
                        ->helperText('A short unique name, for example ssw-age. Letters, numbers and dashes.')
                        ->required()
                        ->maxLength(80)
                        ->regex('/^[a-z0-9-]+$/')
                        ->unique(ignoreRecord: true),
                    Forms\Components\TextInput::make('question_en')
                        ->label('Question (English)')
                        ->required()
                        ->maxLength(255)
                        ->columnSpanFull(),
                    Forms\Components\TextInput::make('question_bn')
                        ->label('Question (Bangla)')
                        ->maxLength(255)
                        ->columnSpanFull(),
                    Forms\Components\Textarea::make('keywords')
                        ->helperText('Words people might use for this question, in English and Bangla, separated by commas. The more real wordings you add, the more often the right answer is found.')
                        ->rows(2)
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Answer')
                ->description('Short and plain: two to four sentences. Do not put fees, dates or test centres here unless you add the date it was checked and set "Valid until".')
                ->schema([
                    Forms\Components\Textarea::make('answer_en')->label('Answer (English)')->required()->rows(5),
                    Forms\Components\Textarea::make('answer_bn')->label('Answer (Bangla)')->rows(5),
                    Forms\Components\Textarea::make('answer_ja')->label('Answer (Japanese, optional)')->rows(4)
                        ->helperText('If empty, Japanese readers see the English answer.'),
                ]),

            Forms\Components\Section::make('Checking')
                ->columns(2)
                ->schema([
                    Forms\Components\TextInput::make('source_url')
                        ->label('Source link')
                        ->url()
                        ->maxLength(500)
                        ->helperText('The official page that proves this answer. Required to verify (except for entries about our own service).')
                        ->columnSpanFull(),
                    Forms\Components\DatePicker::make('valid_until')
                        ->helperText('Optional. After this day the answer is hidden until you update and verify it again. Use it for anything that changes.'),
                    Forms\Components\TextInput::make('sort_order')->numeric()->default(0)->minValue(0),
                    Forms\Components\Textarea::make('staff_note')
                        ->label('Note for staff (never shown to users)')
                        ->helperText('What to double-check before verifying.')
                        ->rows(3)
                        ->columnSpanFull(),
                    Forms\Components\Placeholder::make('state')
                        ->label('Status')
                        ->visibleOn('edit')
                        ->content(function (?AnswerLibraryItem $record) {
                            if (! $record) {
                                return '';
                            }
                            $text = AnswerLibraryItem::STATUSES[$record->status] ?? $record->status;
                            if ($record->status === 'verified' && $record->verified_at) {
                                $text .= ' by ' . ($record->verifier?->name ?? 'staff') . ' on '
                                    . $record->verified_at->timezone('Asia/Dhaka')->format('d M Y');
                            }

                            return $text . '. Use the Verify button on the list to change this.';
                        })
                        ->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('question_en')
                    ->label('Question')
                    ->searchable(['question_en', 'question_bn', 'keywords'])
                    ->limit(70)
                    ->wrap()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('category')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => AnswerLibraryItem::CATEGORIES[$state] ?? $state)
                    ->toggleable(),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => AnswerLibraryItem::STATUSES[$state] ?? $state)
                    ->color(fn (string $state) => match ($state) {
                        'verified' => 'success',
                        'draft'    => 'warning',
                        default    => 'gray',
                    }),

                Tables\Columns\TextColumn::make('valid_until')
                    ->date('d M Y')
                    ->placeholder('—')
                    ->color(fn (AnswerLibraryItem $r) => $r->valid_until && $r->valid_until->endOfDay()->isPast() ? 'danger' : null)
                    ->toggleable(),

                Tables\Columns\TextColumn::make('verified_at')
                    ->label('Verified')
                    ->since()
                    ->placeholder('—')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('times_shown')->label('Shown')->numeric()->sortable()->toggleable(),
                Tables\Columns\TextColumn::make('helpful_yes')->label('Helpful')->numeric()->toggleable(),
                Tables\Columns\TextColumn::make('helpful_no')->label('Not helpful')->numeric()->toggleable(),

                Tables\Columns\IconColumn::make('source_url')
                    ->label('Source')
                    ->boolean()
                    ->trueIcon('heroicon-o-link')
                    ->falseIcon('heroicon-o-minus')
                    ->getStateUsing(fn (AnswerLibraryItem $r) => filled($r->source_url)),
            ])
            ->defaultSort('category')
            ->filters([
                Tables\Filters\SelectFilter::make('status')->options(AnswerLibraryItem::STATUSES),
                Tables\Filters\SelectFilter::make('category')->options(AnswerLibraryItem::CATEGORIES),
                Tables\Filters\Filter::make('expired')
                    ->label('Expired (past "valid until")')
                    ->query(fn (Builder $q) => $q->whereNotNull('valid_until')->whereDate('valid_until', '<', now()->toDateString())),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('verify')
                    ->label('Verify')
                    ->icon('heroicon-o-check-badge')
                    ->color('success')
                    ->visible(fn (AnswerLibraryItem $r) => $r->status !== 'verified')
                    ->requiresConfirmation()
                    ->modalHeading('Verify this answer?')
                    ->modalDescription('Confirm that you compared the answer with its source and that it is correct today. From now on it is shown to users.')
                    ->action(function (AnswerLibraryItem $record) {
                        if ($reason = static::cannotVerifyBecause($record)) {
                            Notification::make()->title('Cannot verify yet')->body($reason)->danger()->send();

                            return;
                        }

                        $record->update([
                            'status'      => 'verified',
                            'verified_by' => auth()->id(),
                            'verified_at' => now(),
                        ]);

                        Notification::make()->title('Verified: now visible to users')->success()->send();
                    }),

                Tables\Actions\Action::make('unverify')
                    ->label('Back to draft')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->visible(fn (AnswerLibraryItem $r) => $r->status === 'verified')
                    ->requiresConfirmation()
                    ->modalDescription('The answer is hidden from users until it is verified again.')
                    ->action(fn (AnswerLibraryItem $record) => $record->update([
                        'status' => 'draft', 'verified_by' => null, 'verified_at' => null,
                    ])),

                Tables\Actions\Action::make('archive')
                    ->label('Archive')
                    ->icon('heroicon-o-archive-box')
                    ->visible(fn (AnswerLibraryItem $r) => $r->status !== 'archived')
                    ->requiresConfirmation()
                    ->modalDescription('The answer is hidden from users and kept for reference.')
                    ->action(fn (AnswerLibraryItem $record) => $record->update([
                        'status' => 'archived', 'verified_by' => null, 'verified_at' => null,
                    ])),

                Tables\Actions\DeleteAction::make()
                    ->visible(fn (AnswerLibraryItem $r) => $r->status !== 'verified'),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListAnswerLibraryItems::route('/'),
            'create' => Pages\CreateAnswerLibraryItem::route('/create'),
            'edit'   => Pages\EditAnswerLibraryItem::route('/{record}/edit'),
        ];
    }
}
