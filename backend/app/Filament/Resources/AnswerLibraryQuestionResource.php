<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AnswerLibraryQuestionResource\Pages;
use App\Models\AnswerLibraryQuestion;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

// "Asked Questions": what people typed into the Answer Library search and what
// they got. Questions the library could not answer are the to-do list for new
// entries. Phone-like numbers and e-mail addresses are masked before saving.
class AnswerLibraryQuestionResource extends Resource
{
    protected static ?string $model            = AnswerLibraryQuestion::class;
    protected static ?string $modelLabel       = 'Asked question';
    protected static ?string $pluralModelLabel = 'Asked Questions';
    protected static ?string $navigationIcon   = 'heroicon-o-chat-bubble-left-right';
    protected static ?string $navigationLabel  = 'Asked Questions';
    protected static ?string $navigationGroup  = 'Skilled Worker Mobility';
    protected static ?int    $navigationSort   = 5;

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    public static function canCreate(): bool
    {
        return false;
    }

    // Questions the library could not answer and nobody has dealt with yet.
    public static function getNavigationBadge(): ?string
    {
        $open = AnswerLibraryQuestion::whereIn('outcome', ['none', 'suggested'])->whereNull('handled_at')->count();

        return $open > 0 ? (string) $open : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('When')
                    ->dateTime('d M Y, h:i A', 'Asia/Dhaka')
                    ->sortable(),

                Tables\Columns\TextColumn::make('question')->wrap()->searchable()->weight('bold'),

                Tables\Columns\TextColumn::make('outcome')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'matched'   => 'Answered',
                        'suggested' => 'Suggestions only',
                        default     => 'No answer',
                    })
                    ->color(fn (string $state) => match ($state) {
                        'matched'   => 'success',
                        'suggested' => 'warning',
                        default     => 'danger',
                    }),

                Tables\Columns\TextColumn::make('item.question_en')->label('Matched entry')->limit(40)->placeholder('—'),

                Tables\Columns\IconColumn::make('helpful')->label('Helpful?')->boolean()->placeholder('—'),

                Tables\Columns\TextColumn::make('lang')->label('Lang')->toggleable(),
                Tables\Columns\IconColumn::make('handled_at')
                    ->label('Handled')
                    ->boolean()
                    ->getStateUsing(fn (AnswerLibraryQuestion $r) => $r->handled_at !== null),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\Filter::make('open')
                    ->label('Not answered and not handled yet')
                    ->default()
                    ->query(fn (Builder $q) => $q->whereIn('outcome', ['none', 'suggested'])->whereNull('handled_at')),
                Tables\Filters\SelectFilter::make('outcome')->options([
                    'matched' => 'Answered', 'suggested' => 'Suggestions only', 'none' => 'No answer',
                ]),
            ])
            ->actions([
                Tables\Actions\Action::make('add_to_library')
                    ->label('Add to library')
                    ->icon('heroicon-o-plus-circle')
                    ->url(fn (AnswerLibraryQuestion $r) => AnswerLibraryItemResource::getUrl('create', ['question' => $r->question])),

                Tables\Actions\Action::make('handled')
                    ->label('Mark handled')
                    ->icon('heroicon-o-check')
                    ->visible(fn (AnswerLibraryQuestion $r) => $r->handled_at === null)
                    ->action(fn (AnswerLibraryQuestion $r) => $r->update(['handled_at' => now()])),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAnswerLibraryQuestions::route('/'),
        ];
    }
}
