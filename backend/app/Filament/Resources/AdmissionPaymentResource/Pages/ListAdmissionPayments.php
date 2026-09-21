<?php

namespace App\Filament\Resources\AdmissionPaymentResource\Pages;

use App\Filament\Resources\AdmissionPaymentResource;
use Filament\Resources\Pages\ListRecords;

class ListAdmissionPayments extends ListRecords
{
    protected static string $resource = AdmissionPaymentResource::class;

    // No CreateAction here — a student's first memo (via Memos → Create
    // Memo) is what puts them on this list; there's nothing to create
    // directly from this read-only rollup.
    protected function getHeaderActions(): array
    {
        return [];
    }
}
