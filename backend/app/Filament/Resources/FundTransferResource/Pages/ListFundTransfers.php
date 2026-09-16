<?php

namespace App\Filament\Resources\FundTransferResource\Pages;

use App\Filament\Resources\FundTransferResource;
use App\Filament\Widgets\BalanceOverviewWidget;
use App\Filament\Widgets\BranchBalanceSummaryWidget;
use Filament\Resources\Pages\ListRecords;

class ListFundTransfers extends ListRecords
{
    protected static string $resource = FundTransferResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            BalanceOverviewWidget::class,
            BranchBalanceSummaryWidget::class,
        ];
    }
}
