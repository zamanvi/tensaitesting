<?php

namespace App\Providers\Filament;

use App\Models\User;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Navigation\NavigationGroup;
use Filament\Navigation\NavigationItem;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class ManagerPanelProvider extends PanelProvider
{
    // Map section names to resource classes
    const SECTION_RESOURCES = [
        'Lead Management'    => [
            \App\Filament\Resources\LeadResource::class,
            \App\Filament\Resources\InterviewResource::class,
        ],
        'Verification'       => [
            \App\Filament\Resources\OcrJobResource::class,
        ],
        'Users & Gateways'   => [
            \App\Filament\Resources\UserResource::class,
            \App\Filament\Resources\AgencyProfileResource::class,
            \App\Filament\Resources\InstitutionProfileResource::class,
            \App\Filament\Resources\StudentProfileResource::class,
            \App\Filament\Resources\AffiliateResource::class,
        ],
        'Branches'           => [
            \App\Filament\Resources\BranchResource::class,
            \App\Filament\Resources\BranchManagerResource::class,
        ],
        'Support'            => [
            \App\Filament\Resources\HelpRequestResource::class,
            \App\Filament\Resources\ContactPaperResource::class,
            \App\Filament\Resources\TensaiNotificationResource::class,
        ],
        'Earnings & Payouts' => [
            \App\Filament\Resources\CommissionResource::class,
        ],
        'Content'            => [
            \App\Filament\Resources\GalleryItemResource::class,
        ],
        'Settings'           => [
            \App\Filament\Resources\SettingResource::class,
        ],
    ];

    public function panel(Panel $panel): Panel
    {
        $resources = $this->resolveResources();

        return $panel
            ->id('manager')
            ->path('manager')
            ->login()
            ->brandName('Tensai — Manager')
            ->brandLogo(fn () => view('filament.brand'))
            ->brandLogoHeight('3rem')
            ->favicon(asset('images/tensai-logo.png'))
            ->darkMode(true)
            ->colors([
                'primary' => Color::hex('#3D6117'),
                'danger'  => Color::Rose,
                'success' => Color::Emerald,
                'warning' => Color::Amber,
                'info'    => Color::Sky,
                'gray'    => Color::Slate,
            ])
            ->sidebarCollapsibleOnDesktop()
            ->resources($resources)
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }

    private function resolveResources(): array
    {
        $user = auth('web')->user();

        if (!$user || !$user instanceof User) {
            return [];
        }

        $sections = $user->manager_sections ?? [];
        $resources = [];

        foreach ($sections as $section) {
            foreach (self::SECTION_RESOURCES[$section] ?? [] as $resource) {
                if (class_exists($resource)) {
                    $resources[] = $resource;
                }
            }
        }

        return array_unique($resources);
    }
}
