<?php

namespace App\Filament\Resources\PaymentCategoryResource\Pages;

use App\Filament\Resources\PaymentCategoryResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListPaymentCategories extends ListRecords
{
    protected static string $resource = PaymentCategoryResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
