<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class EmailVerificationNotification extends Notification
{
    public function __construct(private string $code) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Verify Your Tensai Account')
            ->greeting('Welcome to Tensai!')
            ->line('Use the code below to verify your email address:')
            ->line('**' . $this->code . '**')
            ->line('This code expires in 30 minutes.')
            ->line('If you did not create a Tensai account, ignore this email.');
    }
}
