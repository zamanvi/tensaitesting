<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends Notification
{
    public function __construct(private string $url) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset Your Tensai Password')
            ->greeting('Hello!')
            ->line('You requested a password reset for your Tensai account.')
            ->action('Reset Password', $this->url)
            ->line('This link expires in 60 minutes.')
            ->line('If you did not request a reset, ignore this email.');
    }
}
