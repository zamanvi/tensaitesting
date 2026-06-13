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

    public string $facebook_url  = '';
    public string $youtube_url   = '';
    public string $instagram_url = '';
    public string $tiktok_url    = '';
    public string $linkedin_url  = '';
    public string $twitter_url   = '';

    public string $copyright_en = '';
    public string $copyright_ja = '';
    public string $copyright_bn = '';

    public function mount(): void
    {
        $this->support_whatsapp = Setting::get('support_whatsapp', '8801826192179');
        $this->support_phone    = Setting::get('support_phone', '+8801826192179');
        $this->support_email    = Setting::get('support_email', '');
        $this->office_address   = Setting::get('office_address', '');

        $this->facebook_url  = Setting::get('facebook_url', '');
        $this->youtube_url   = Setting::get('youtube_url', '');
        $this->instagram_url = Setting::get('instagram_url', '');
        $this->tiktok_url    = Setting::get('tiktok_url', '');
        $this->linkedin_url  = Setting::get('linkedin_url', '');
        $this->twitter_url   = Setting::get('twitter_url', '');

        $this->copyright_en = Setting::get('copyright_en', '');
        $this->copyright_ja = Setting::get('copyright_ja', '');
        $this->copyright_bn = Setting::get('copyright_bn', '');
    }

    public function save(): void
    {
        $this->validate([
            'support_whatsapp' => 'required|string|max:20',
            'support_phone'    => 'required|string|max:20',
            'support_email'    => 'nullable|email|max:100',
            'office_address'   => 'nullable|string|max:500',
            'facebook_url'     => 'nullable|url|max:255',
            'youtube_url'      => 'nullable|url|max:255',
            'instagram_url'    => 'nullable|url|max:255',
            'tiktok_url'       => 'nullable|url|max:255',
            'linkedin_url'     => 'nullable|url|max:255',
            'twitter_url'      => 'nullable|url|max:255',
            'copyright_en'     => 'nullable|string|max:255',
            'copyright_ja'     => 'nullable|string|max:255',
            'copyright_bn'     => 'nullable|string|max:255',
        ]);

        Setting::set('support_whatsapp', $this->support_whatsapp);
        Setting::set('support_phone',    $this->support_phone);
        Setting::set('support_email',    $this->support_email);
        Setting::set('office_address',   $this->office_address);

        Setting::set('facebook_url',  $this->facebook_url);
        Setting::set('youtube_url',   $this->youtube_url);
        Setting::set('instagram_url', $this->instagram_url);
        Setting::set('tiktok_url',    $this->tiktok_url);
        Setting::set('linkedin_url',  $this->linkedin_url);
        Setting::set('twitter_url',   $this->twitter_url);

        Setting::set('copyright_en', $this->copyright_en);
        Setting::set('copyright_ja', $this->copyright_ja);
        Setting::set('copyright_bn', $this->copyright_bn);

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
                ])->columns(2),

            Forms\Components\Section::make('Office')
                ->schema([
                    Forms\Components\Textarea::make('office_address')
                        ->label('Office Address')
                        ->helperText('Full address shown on the contact/about page')
                        ->rows(3)
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Social Media Links')
                ->description('These URLs appear in the website footer and contact page.')
                ->schema([
                    Forms\Components\TextInput::make('facebook_url')->label('Facebook')->url()->placeholder('https://facebook.com/...'),
                    Forms\Components\TextInput::make('youtube_url')->label('YouTube')->url()->placeholder('https://youtube.com/...'),
                    Forms\Components\TextInput::make('instagram_url')->label('Instagram')->url()->placeholder('https://instagram.com/...'),
                    Forms\Components\TextInput::make('tiktok_url')->label('TikTok')->url()->placeholder('https://tiktok.com/...'),
                    Forms\Components\TextInput::make('linkedin_url')->label('LinkedIn')->url()->placeholder('https://linkedin.com/...'),
                    Forms\Components\TextInput::make('twitter_url')->label('X / Twitter')->url()->placeholder('https://x.com/...'),
                ])->columns(2),

            Forms\Components\Section::make('Copyright Text')
                ->description('Shown in the website footer. Use {year} as a placeholder for the current year.')
                ->schema([
                    Forms\Components\TextInput::make('copyright_en')
                        ->label('English')
                        ->placeholder('© {year} Tensai Consultancy. All rights reserved.'),
                    Forms\Components\TextInput::make('copyright_ja')
                        ->label('Japanese')
                        ->placeholder('© {year} Tensai Consultancy. 全著作権所有。'),
                    Forms\Components\TextInput::make('copyright_bn')
                        ->label('Bengali')
                        ->placeholder('© {year} Tensai Consultancy. সর্বস্বত্ব সংরক্ষিত।'),
                ])->columns(1),
        ]);
    }
}
