<?php

namespace App\Filament\Resources\FundTransferResource\Pages;

use App\Filament\Resources\FundTransferResource;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Infolist;
use Filament\Resources\Pages\ViewRecord;

class ViewFundTransfer extends ViewRecord
{
    protected static string $resource = FundTransferResource::class;

    // No edit page is registered for this resource — branches create these,
    // head office only acknowledges them via the "Mark as Received" table
    // action — so the default ViewRecord header (which ships an EditAction)
    // is overridden to stay empty here.
    protected function getHeaderActions(): array
    {
        return [];
    }

    public function infolist(Infolist $infolist): Infolist
    {
        return $infolist->schema([
            Section::make()->columns(3)->schema([
                TextEntry::make('branch.name')->label('Branch'),
                TextEntry::make('amount')->money(fn ($record) => $record->currency),
                TextEntry::make('status')->badge()
                    ->color(fn ($state) => $state === 'received' ? 'success' : 'warning')
                    ->formatStateUsing(fn ($state) => ucfirst($state)),
            ]),
            Section::make('Details')->columns(2)->schema([
                TextEntry::make('bank_reference')->label('Bank Reference')->placeholder('—'),
                TextEntry::make('created_at')->label('Sent')->dateTime('d M Y, H:i'),
                TextEntry::make('receiver.name')->label('Received By')->placeholder('—'),
                TextEntry::make('received_at')->label('Received At')->dateTime('d M Y, H:i')->placeholder('—'),
                TextEntry::make('notes')->label('Notes')->placeholder('—')->columnSpanFull(),
            ]),
        ]);
    }
}
