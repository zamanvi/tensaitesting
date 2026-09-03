<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Payment $payment,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Payment Receipt {$this->payment->receipt_no} — Tensai",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment_receipt',
            with: [
                'payment' => $this->payment->load(['branch', 'category', 'application']),
            ],
        );
    }
}
