<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Filament\Pages\MemoStatement;
use App\Filament\Resources\PaymentCategoryResource;
use App\Filament\Resources\PaymentResource;
use Filament\Actions;
use Filament\Facades\Filament;
use Filament\Resources\Pages\ListRecords;

class ListPayments extends ListRecords
{
    protected static string $resource = PaymentResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // PaymentCategoryResource is out of the sidebar (see its
            // $shouldRegisterNavigation) — this is the way in instead.
            Actions\Action::make('manage_categories')
                ->label('Manage Categories')
                ->icon('heroicon-o-tag')
                ->color('gray')
                ->url(fn () => PaymentCategoryResource::getUrl('index'))
                // This page is shared with the manager panel, where
                // PaymentCategoryResource isn't registered — getUrl() there
                // throws RouteNotFoundException and 500s the whole page.
                ->visible(fn () => PaymentCategoryResource::canAccess()
                    && in_array(PaymentCategoryResource::class, Filament::getCurrentPanel()?->getResources() ?? [], true)),

            // MemoStatement is out of the sidebar too now (same reasoning —
            // it's a report generated from this same Memo data, not an
            // independent section) — reached from here instead.
            Actions\Action::make('statement')
                ->label('Statement')
                ->icon('heroicon-o-document-chart-bar')
                ->color('gray')
                ->url(fn () => MemoStatement::getUrl()),

            Actions\CreateAction::make()->label('Create Memo'),
        ];
    }
}
