<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FundTransferResource\Pages;
use App\Models\FundTransfer;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class FundTransferResource extends Resource
{
    protected static ?string $model         = FundTransfer::class;
    protected static ?string $navigationIcon  = 'heroicon-o-arrow-path-rounded-square';
    protected static ?string $navigationGroup = 'Revenue';
    protected static ?string $navigationLabel = 'Fund Transfers';
    protected static ?int    $navigationSort  = 2;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    // Branches create these from their dashboard when they send money over —
    // head office's only job here is to acknowledge receipt via the
    // "Mark as Received" table action, not a generic edit form.
    public static function canCreate(): bool { return false; }
    public static function canEdit($record): bool { return false; }
    public static function canDelete($record): bool { return false; }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['branch', 'receiver']);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->weight('semibold')
                    ->searchable(),

                Tables\Columns\TextColumn::make('amount')
                    ->money(fn (FundTransfer $r) => $r->currency)
                    ->sortable(),

                Tables\Columns\TextColumn::make('bank_reference')
                    ->label('Reference')
                    ->placeholder('—')
                    ->fontFamily('mono'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => $state === 'received' ? 'success' : 'warning')
                    ->formatStateUsing(fn ($state) => ucfirst($state)),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Sent')
                    ->since()
                    ->sortable(),

                Tables\Columns\TextColumn::make('received_at')
                    ->label('Received')
                    ->dateTime('d M Y, H:i')
                    ->placeholder('—')
                    ->toggleable(),
            ])
            ->filters([
                SelectFilter::make('branch_id')->label('Branch')->relationship('branch', 'name'),
                SelectFilter::make('status')->options(['pending' => 'Pending', 'received' => 'Received']),
            ])
            ->actions([
                Tables\Actions\Action::make('mark_received')
                    ->label('Mark as Received')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalDescription('Confirms head office has received this bank transfer and closes it out of the branch\'s pending balance.')
                    ->visible(fn (FundTransfer $r) => $r->status === 'pending')
                    ->action(function (FundTransfer $r) {
                        $r->update([
                            'status'      => 'received',
                            'receiver_id' => auth()->id(),
                            'received_at' => now(),
                        ]);
                        Notification::make()->title('Fund transfer marked as received')->success()->send();
                    }),

                Tables\Actions\ViewAction::make(),
            ])
            ->emptyStateHeading('No fund transfers yet')
            ->emptyStateDescription('Branches will appear here once they log a settlement transfer.')
            ->emptyStateIcon('heroicon-o-arrow-path-rounded-square');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListFundTransfers::route('/'),
            'view'  => Pages\ViewFundTransfer::route('/{record}'),
        ];
    }
}
