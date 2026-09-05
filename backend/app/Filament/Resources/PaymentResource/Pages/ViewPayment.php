<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Filament\Resources\PaymentResource;
use Filament\Infolists\Components\RepeatableEntry;
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
            Section::make()->columns(4)->schema([
                TextEntry::make('receipt_no')->label('Receipt No.')->fontFamily('mono')->copyable(),
                TextEntry::make('created_at')->label('Date')->dateTime('d M Y, H:i'),
                TextEntry::make('status')->badge()
                    ->color(fn ($state) => match ($state) {
                        'paid' => 'success', 'partial' => 'warning', 'due' => 'danger', default => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => ucfirst($state)),
                TextEntry::make('amount')->label('Collected')->money(fn ($record) => $record->currency),
            ]),
            Section::make()->columns(2)->visible(fn ($record) => $record->status !== 'paid')->schema([
                TextEntry::make('total_amount')->label('Total Invoiced')->money(fn ($record) => $record->currency),
                TextEntry::make('due_amount')->label('Balance Due')->money(fn ($record) => $record->currency)->color('danger'),
            ]),
            // Installment-by-installment history — the memo above stays the
            // one invoice; this is every time money actually changed hands
            // against it (the initial creation counts as the first row).
            Section::make('Payment History')
                ->visible(fn ($record) => $record->collections->count() > 1)
                ->schema([
                    RepeatableEntry::make('collections')
                        ->label('')
                        ->schema([
                            TextEntry::make('created_at')->label('Date')->dateTime('d M Y, h:i A'),
                            TextEntry::make('amount')->label('Amount')->money(fn ($record) => $record->payment->currency),
                            TextEntry::make('receiver.name')->label('Received By')->placeholder('—'),
                        ])
                        ->columns(3),
                ]),
            Section::make('Customer')->columns(2)->schema([
                TextEntry::make('customer_name')->label('Name'),
                TextEntry::make('customer_phone')->label('Phone')->placeholder('—'),
                TextEntry::make('customer_email')->label('Email')->placeholder('—'),
                TextEntry::make('application.application_code')->label('Application')->placeholder('—'),
                TextEntry::make('formTemplate.name')->label('Service Form')
                    ->formatStateUsing(fn ($state, $record) => $record->formTemplate ? "{$record->formTemplate->country} — {$state}" : null)
                    ->placeholder('Walk-in (no application or service)'),
            ]),
            Section::make('Routing')->columns(3)->schema([
                TextEntry::make('branch.name')->label('Branch')->placeholder('Main Branch'),
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
