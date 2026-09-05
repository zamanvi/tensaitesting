<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Filament\Resources\PaymentCategoryResource;
use App\Filament\Resources\PaymentResource;
use Filament\Actions;
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
                ->url(fn () => PaymentCategoryResource::getUrl('index')),

            Actions\CreateAction::make()->label('Create Memo'),
        ];
    }
}
