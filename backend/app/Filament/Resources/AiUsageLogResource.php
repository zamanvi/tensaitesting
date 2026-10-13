<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AiUsageLogResource\Pages;
use App\Models\AiUsageLog;
use Filament\Forms;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

// "AI Usage": a read-only report of every call the website made to an AI
// service — which feature, how many tokens, what it roughly cost, whether it
// worked. Counts only; the text of a question or answer is never stored.
class AiUsageLogResource extends Resource
{
    protected static ?string $model                = AiUsageLog::class;
    protected static ?string $modelLabel           = 'AI call';
    protected static ?string $pluralModelLabel     = 'AI Usage';
    protected static ?string $navigationIcon       = 'heroicon-o-cpu-chip';
    protected static ?string $navigationLabel      = 'AI Usage';
    protected static ?string $navigationGroup      = 'Settings';
    protected static ?int    $navigationSort       = 9;

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    // A report: nothing is created, edited or deleted here.
    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        $bdt = (float) config('ai.bdt_per_usd', 120);

        return $table
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('When')
                    ->dateTime('d M Y, h:i A', 'Asia/Dhaka')
                    ->sortable(),

                Tables\Columns\TextColumn::make('feature')
                    ->badge()
                    ->color('info')
                    ->searchable(),

                Tables\Columns\TextColumn::make('provider')->toggleable(),
                Tables\Columns\TextColumn::make('model')->toggleable()->searchable(),

                Tables\Columns\TextColumn::make('input_tokens')
                    ->label('Input tokens')
                    ->numeric()
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->label('Total')),

                Tables\Columns\TextColumn::make('output_tokens')
                    ->label('Output tokens')
                    ->numeric()
                    ->summarize(Tables\Columns\Summarizers\Sum::make()->label('Total')),

                Tables\Columns\TextColumn::make('cost_usd')
                    ->label('Est. cost')
                    ->formatStateUsing(fn ($state) => $state === null
                        ? 'not priced'
                        : '$' . number_format((float) $state, 4) . ' (≈ ৳' . number_format((float) $state * $bdt, 2) . ')')
                    ->summarize(
                        Tables\Columns\Summarizers\Sum::make()
                            ->label('Total')
                            ->formatStateUsing(fn ($state) => '$' . number_format((float) $state, 4)
                                . ' (≈ ৳' . number_format((float) $state * $bdt, 2) . ')')
                    ),

                Tables\Columns\IconColumn::make('ok')->label('Worked')->boolean(),
                Tables\Columns\TextColumn::make('error')->placeholder('—')->toggleable(),
                Tables\Columns\TextColumn::make('latency_ms')
                    ->label('Time')
                    ->suffix(' ms')
                    ->numeric()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('User')
                    ->placeholder('—')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('feature')
                    ->options(fn () => AiUsageLog::query()->distinct()->orderBy('feature')->pluck('feature', 'feature')->all()),
                Tables\Filters\TernaryFilter::make('ok')->label('Worked'),
                Tables\Filters\Filter::make('period')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label('From'),
                        Forms\Components\DatePicker::make('until')->label('Until'),
                    ])
                    ->columns(2)
                    ->query(fn (Builder $query, array $data) => $query
                        ->when($data['from'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                        ->when($data['until'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '<=', $d))),
            ])
            ->actions([])
            ->bulkActions([])
            ->paginated([25, 50, 100]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAiUsageLogs::route('/'),
        ];
    }
}
