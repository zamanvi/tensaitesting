<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Filament\Resources\PaymentResource;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Infolist;
use Filament\Resources\Pages\ViewRecord;

class ViewPayment extends ViewRecord
{
    protected static string $resource = PaymentResource::class;

    // No edit page is registered for this resource (audit-only — see
    // PaymentResource::canEdit()), so the default ViewRecord header, which
    // otherwise ships an EditAction, is overridden to stay empty here.
    protected function getHeaderActions(): array
    {
        return [];
    }

    public function infolist(Infolist $infolist): Infolist
    {
        return $infolist->schema([
            Section::make()->columns(3)->schema([
                TextEntry::make('receipt_no')->label('Receipt No.')->fontFamily('mono')->copyable(),
                TextEntry::make('created_at')->label('Date')->dateTime('d M Y, H:i'),
                TextEntry::make('amount')->money(fn ($record) => $record->currency),
            ]),
            Section::make('Customer')->columns(2)->schema([
                TextEntry::make('customer_name')->label('Name'),
                TextEntry::make('customer_phone')->label('Phone')->placeholder('—'),
                TextEntry::make('customer_email')->label('Email')->placeholder('—'),
                TextEntry::make('application.application_code')->label('Application')->placeholder('Walk-in (no application)'),
            ]),
            Section::make('Routing')->columns(3)->schema([
                TextEntry::make('branch.name')->label('Branch'),
                TextEntry::make('category.label')->label('Category'),
                TextEntry::make('fund_target')->label('Routed To')
                    ->formatStateUsing(fn ($state) => $state === 'branch' ? 'Branch Fund' : 'Head Office Fund')
                    ->badge()
                    ->color(fn ($state) => $state === 'branch' ? 'success' : 'info'),
                TextEntry::make('method')->label('Method')->formatStateUsing(fn ($state) => ucfirst($state)),
                TextEntry::make('receiver.name')->label('Received By')->placeholder('—'),
                TextEntry::make('notes')->label('Notes')->placeholder('—')->columnSpanFull(),
            ]),
        ]);
    }
}
