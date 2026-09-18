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

        // manager_sections holds individual resource class names (each
        // section picked one at a time on the Managers form), not whole
        // nav groups — a Manager can be granted just Gallery without also
        // getting Posts/News or Categories from the same Content group.
        $allowedResources = $user->manager_sections ?? [];
        if (empty($allowedResources)) return [];

        $resourcePath = app_path('Filament/Resources');
        $resources = [];

        foreach (glob($resourcePath . '/*.php') as $file) {
            $class = 'App\\Filament\\Resources\\' . basename($file, '.php');
            if (!class_exists($class)) continue;

            if (in_array($class, $allowedResources, true)) {
                $resources[] = $class;
            }
        }

        return array_unique($resources);
    }
}
