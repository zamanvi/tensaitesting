<?php

namespace App\Filament\Resources\TensaiNotificationResource\Pages;

use App\Filament\Resources\TensaiNotificationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListTensaiNotifications extends ListRecords
{
    protected static string $resource = TensaiNotificationResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\CreateAction::make()];
    }
}
