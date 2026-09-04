<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Filament\Resources\PaymentResource;
use App\Mail\PaymentReceiptMail;
use App\Models\PaymentCategory;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Mail;

class CreatePayment extends CreateRecord
{
    protected static string $resource = PaymentResource::class;

    // Mirrors BranchAdminController::storePayment() — same fund_target
    // snapshot rule and the same "whoever is creating this is the receiver"
    // convention, just with the admin as the receiver instead of a branch
    // staff account.
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $category = PaymentCategory::find($data['payment_category_id']);

        $data['fund_target'] = $category?->fund_target ?? 'head_office';
        $data['received_by'] = auth()->id();

        // 'main' is the virtual Head Office option, not a real Branch id —
        // a memo filed there has no branch at all.
        if (($data['branch_id'] ?? null) === 'main') {
            $data['branch_id'] = null;
        }

        return $data;
    }

    protected function afterCreate(): void
    {
        $payment = $this->record;

        if ($payment->customer_email) {
            Mail::to($payment->customer_email)->queue(new PaymentReceiptMail($payment));
        }
    }
}
