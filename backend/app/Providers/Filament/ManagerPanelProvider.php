<?php

namespace App\Providers\Filament;

use App\Filament\Resources\ManagerResource;
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
        $pages     = $this->resolvePages();

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
            ->pages($pages)
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

    // Registers every class a Manager could conceivably be granted —
    // unconditionally, not filtered by the logged-in manager's own
    // manager_sections. Panel::panel() runs during service-provider boot,
    // before the session/auth middleware executes, so auth('web')->user()
    // is always null here regardless of who's actually logged in — the
    // previous per-user filtering silently produced an empty resource list
    // (and a Dashboard-only page list) for every manager, every time. The
    // real per-manager gate now lives in each class's own canAccess()
    // (see App\Filament\Support\ManagerAccess), which Filament checks
    // per-request, once auth is actually available — same pattern already
    // used for ManagerResource/UserResource being admin-only.
    private function resolveResources(): array
    {
        return array_values(array_filter(
            ManagerResource::grantableClasses(),
            fn (string $class) => is_subclass_of($class, \Filament\Resources\Resource::class)
        ));
    }

    // Dashboard is always included — it's every manager's landing page, not
    // something Admin grants per-account.
    private function resolvePages(): array
    {
        $pages = array_values(array_filter(
            ManagerResource::grantableClasses(),
            fn (string $class) => is_subclass_of($class, \Filament\Pages\Page::class)
        ));

        return array_unique([\App\Filament\Pages\Dashboard::class, ...$pages]);
    }
}
