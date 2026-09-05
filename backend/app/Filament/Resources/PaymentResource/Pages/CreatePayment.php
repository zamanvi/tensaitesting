<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Filament\Resources\PaymentResource;
use App\Mail\PaymentReceiptMail;
use App\Models\PaymentCategory;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CreatePayment extends CreateRecord
{
    protected static string $resource = PaymentResource::class;

    // Mirrors BranchAdminController::storePayment() — same fund_target
    // snapshot rule and the same "whoever is creating this is the receiver"
    // convention, just with the admin as the receiver instead of a branch
    // staff account.
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // "Add a new category instead" was on — new_category_label/
        // new_category_fund_target only reach $data when that toggle is on
        // (see PaymentResource's dehydrated() on those fields), and fund
        // routing is required there too, same as the old modal version.
        if (!empty($data['new_category_label'])) {
            $category = PaymentCategory::create([
                'key'         => Str::slug($data['new_category_label'], '_') . '_' . Str::random(4),
                'label'       => $data['new_category_label'],
                'fund_target' => $data['new_category_fund_target'],
                'is_active'   => true,
                'sort_order'  => (int) (PaymentCategory::max('sort_order') ?? 0) + 1,
            ]);
            $data['payment_category_id'] = $category->id;
        } else {
            $category = PaymentCategory::find($data['payment_category_id']);
        }

        unset($data['new_category_label'], $data['new_category_fund_target']);

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

        if (!$payment->customer_email) return;

        // A mail-send failure (bad SMTP creds, an unverified sending domain,
        // Resend/provider downtime) must never undo — or even fail — the
        // memo itself; the ledger entry is the important part, the receipt
        // is a courtesy on top of it. QUEUE_CONNECTION=sync means this call
        // sends inline, so an uncaught exception here would otherwise bubble
        // up as a 500 on the whole Create action.
        try {
            Mail::to($payment->customer_email)->queue(new PaymentReceiptMail($payment));
        } catch (\Throwable $e) {
            Log::error('Memo created but receipt email failed to send.', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);
            Notification::make()
                ->title('Memo created — but the receipt email failed to send')
                ->body('Check the mail configuration. The memo itself was saved fine.')
                ->warning()
                ->send();
        }
    }
}
