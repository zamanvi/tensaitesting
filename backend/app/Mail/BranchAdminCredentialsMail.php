<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BranchAdminCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $adminName,
        public readonly string $branchName,
        public readonly string $email,
        public readonly string $plainPassword,
        public readonly string $loginUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Branch Admin Access – {$this->branchName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.branch_admin_credentials',
        );
    }
}
