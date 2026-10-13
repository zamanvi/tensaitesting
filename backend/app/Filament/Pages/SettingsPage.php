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
    protected static ?string $navigationLabel = 'Site Settings';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?int    $navigationSort  = 2;
    protected static string  $view            = 'filament.pages.settings-page';

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    public string $support_whatsapp = '';
    // Optional: a separate WhatsApp number for the "My CV" assistant section.
    // Empty = the section falls back to the support WhatsApp number.
    public string $cv_whatsapp      = '';
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

    // Optional YouTube link for the home page's intro video section — the
    // section simply doesn't render on the site while this is empty.
    public string $intro_video_url = '';

    // Staff-only: the websites and the standing instructions used by the
    // "Copy for AI" button on Talent Passports. Never exposed publicly.
    public string $job_search_sites  = '';
    public string $job_search_prompt = '';

    public function mount(): void
    {
        $this->job_search_sites  = Setting::get('job_search_sites', '');
        $this->job_search_prompt = Setting::get('job_search_prompt', '') !== ''
            ? Setting::get('job_search_prompt', '')
            : \App\Support\JobSearchPack::DEFAULT_PROMPT;

        $this->support_whatsapp = Setting::get('support_whatsapp', '8801826192179');
        $this->cv_whatsapp      = Setting::get('cv_whatsapp', '');
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

        $this->intro_video_url = Setting::get('intro_video_url', '');
    }

    public function save(): void
    {
        $this->validate([
            'support_whatsapp' => 'required|string|max:20',
            'cv_whatsapp'      => ['nullable', 'string', 'max:25', 'regex:/^\+?[0-9 \-]{8,25}$/'],
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
            'job_search_sites'  => 'nullable|string|max:2000',
            'job_search_prompt' => 'nullable|string|max:4000',
            'intro_video_url'  => [
                'nullable', 'url', 'max:255',
                // Only YouTube links — anything else would just render a
                // broken player on the home page.
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (blank($value)) {
                        return;
                    }
                    $host = strtolower((string) parse_url($value, PHP_URL_HOST));
                    $host = preg_replace('/^(www|m)\./', '', $host);
                    if (! in_array($host, ['youtube.com', 'youtu.be', 'youtube-nocookie.com'], true)) {
                        $fail('Please paste a YouTube link (youtube.com or youtu.be).');
                    }
                },
            ],
        ]);

        Setting::set('support_whatsapp', $this->support_whatsapp);
        // Digits only, so the wa.me link always works however it was typed.
        Setting::set('cv_whatsapp',      preg_replace('/\D+/', '', $this->cv_whatsapp));
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

        // An unchanged default prompt is stored as empty, so a later improvement
        // to the built-in text reaches everyone who never edited it.
        Setting::set('job_search_sites', trim($this->job_search_sites));
        Setting::set(
            'job_search_prompt',
            trim($this->job_search_prompt) === trim(\App\Support\JobSearchPack::DEFAULT_PROMPT) ? '' : trim($this->job_search_prompt)
        );

        Setting::set('intro_video_url', $this->intro_video_url);

        Notification::make()->title('Settings saved.')->success()->send();
    }

    public function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Support Contact')
                ->description('The contact details visitors see on the website. Change a number here and it changes everywhere it is used, no developer needed.')
                ->schema([
                    Forms\Components\TextInput::make('support_whatsapp')
                        ->label('WhatsApp number (general support)')
                        ->helperText('Used for the WhatsApp buttons on the Home, Contact, About and branch pages. Write the full number with country code, digits only, no + sign. Example: 8801826192179  (880 = Bangladesh, then the number without the first 0).')
                        ->placeholder('8801XXXXXXXXX')
                        ->required(),
                    Forms\Components\TextInput::make('support_phone')
                        ->label('Phone number (for calls)')
                        ->helperText('Shown on the About page as a tap-to-call number. Write it with a + sign and country code. Example: +8801826192179')
                        ->placeholder('+8801XXXXXXXXX')
                        ->required(),
                    Forms\Components\TextInput::make('support_email')
                        ->label('Support email')
                        ->helperText('Shown on the About page as an email link. Optional.')
                        ->placeholder('info@example.com')
                        ->email(),
                ])->columns(2),

            Forms\Components\Section::make('My CV (job-search assistant)')
                ->description('When a person opens the "My CV" section of their account and staff have not switched the assistant on for them yet, they see a message and a green WhatsApp button. The button opens WhatsApp with the number below, so they can ask you to switch it on. You switch it on from Talent Passports → "Activate CV".')
                ->schema([
                    Forms\Components\TextInput::make('cv_whatsapp')
                        ->label('WhatsApp number for My CV')
                        ->helperText('Use this if a different person or phone handles CV requests. Same format as above: country code, digits only, no + sign. Example: 8801711222333. LEAVE EMPTY to use the general support WhatsApp number above.')
                        ->placeholder('Empty = same as the support WhatsApp number')
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Office')
                ->description('Your physical office, shown to visitors on the About page.')
                ->schema([
                    Forms\Components\Textarea::make('office_address')
                        ->label('Office address')
                        ->helperText('Write the full address as you want it shown, one or two lines. Optional.')
                        ->rows(3)
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Home Page Intro Video')
                ->description('A short YouTube video introducing the website/platform, shown on the home page right below the top banner. Leave empty to hide the section.')
                ->schema([
                    Forms\Components\TextInput::make('intro_video_url')
                        ->label('YouTube Video Link')
                        ->url()
                        ->placeholder('https://www.youtube.com/watch?v=...')
                        ->helperText('Open the video on YouTube, copy the address from the browser bar (or use the Share button → Copy) and paste it here. Only YouTube links work.')
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Social Media Links')
                ->description('Paste the full web address of each page (starting with https://). An icon appears in the website footer only for the boxes you fill in; leave a box empty to hide its icon. Facebook and YouTube icons show in the footer of every page. Instagram, TikTok, LinkedIn and X show in the Home page footer.')
                ->schema([
                    Forms\Components\TextInput::make('facebook_url')->label('Facebook')->url()->placeholder('https://facebook.com/...'),
                    Forms\Components\TextInput::make('youtube_url')->label('YouTube')->url()->placeholder('https://youtube.com/...'),
                    Forms\Components\TextInput::make('instagram_url')->label('Instagram')->url()->placeholder('https://instagram.com/...'),
                    Forms\Components\TextInput::make('tiktok_url')->label('TikTok')->url()->placeholder('https://tiktok.com/...'),
                    Forms\Components\TextInput::make('linkedin_url')->label('LinkedIn')->url()->placeholder('https://linkedin.com/...'),
                    Forms\Components\TextInput::make('twitter_url')->label('X / Twitter')->url()->placeholder('https://x.com/...'),
                ])->columns(2),

            Forms\Components\Section::make('Job search helper (staff only)')
                ->description('Used by the "Copy for AI" button in Skilled Worker Mobility → Talent Passports. The button copies these instructions plus the candidates\' CVs (short name, reference code, age; no phone or e-mail) so staff can paste them into an AI chat and ask it to find current job circulars. Nothing is sent from the website.')
                ->schema([
                    Forms\Components\Textarea::make('job_search_sites')
                        ->label('Websites the AI should search')
                        ->helperText('One website per line, for example the official Japan SSW pages and job boards you trust. Leave empty to let the AI use official pages and well-known job boards.')
                        ->placeholder("example-jobboard.com\nexample-ministry.go.jp")
                        ->rows(5)
                        ->columnSpanFull(),
                    Forms\Components\Textarea::make('job_search_prompt')
                        ->label('Instructions for the AI')
                        ->helperText('Keep {SITES} where the list of websites above should appear. If you ever want the original text back, clear this box and save.')
                        ->rows(14)
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Copyright Text')
                ->description('The small line at the very bottom of the website, one for each language. Type {year} where the year should appear and it updates itself every January. Leave empty to use the default line.')
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
