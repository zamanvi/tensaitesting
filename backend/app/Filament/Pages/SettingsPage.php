<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;

class SettingsPage extends Page
{
    protected static ?string $navigationIcon  = 'heroicon-o-cog-6-tooth';
    protected static ?string $navigationLabel = 'Settings';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?int    $navigationSort  = 2;
    protected static string  $view            = 'filament.pages.settings-page';

    public string $support_whatsapp = '';
    public string $support_phone    = '';
    public string $support_email    = '';
    public string $office_address   = '';

    public function mount(): void
    {
        $this->support_whatsapp = Setting::get('support_whatsapp', '8801826192179');
        $this->support_phone    = Setting::get('support_phone', '+8801826192179');
        $this->support_email    = Setting::get('support_email', '');
        $this->office_address   = Setting::get('office_address', '');
    }

    public function save(): void
    {
        $this->validate([
            'support_whatsapp' => 'required|string|max:20',
            'support_phone'    => 'required|string|max:20',
            'support_email'    => 'nullable|email|max:100',
            'office_address'   => 'nullable|string|max:500',
        ]);

        Setting::set('support_whatsapp', $this->support_whatsapp);
        Setting::set('support_phone',    $this->support_phone);
        Setting::set('support_email',    $this->support_email);
        Setting::set('office_address',   $this->office_address);

        Notification::make()->title('Settings saved.')->success()->send();
    }

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Support Contact')
                ->schema([
                    Forms\Components\TextInput::make('support_whatsapp')
                        ->label('WhatsApp Number')
                        ->helperText('International format without +, e.g. 8801826192179')
                        ->required(),
                    Forms\Components\TextInput::make('support_phone')
                        ->label('Phone Number')
                        ->helperText('With + prefix, e.g. +8801826192179')
                        ->required(),
                    Forms\Components\TextInput::make('support_email')
                        ->label('Support Email')
                        ->helperText('Public support email shown on the site')
                        ->email(),
                ]),

            Forms\Components\Section::make('Office')
                ->schema([
                    Forms\Components\Textarea::make('office_address')
                        ->label('Office Address')
                        ->helperText('Full address shown on the contact/about page')
                        ->rows(3),
                ]),
        ]);
    }
}
