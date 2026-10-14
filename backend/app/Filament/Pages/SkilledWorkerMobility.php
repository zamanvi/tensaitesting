<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

// Landing page of the "Skilled Worker Mobility" sidebar group. Pure overview —
// no database access. The group's real resources (Skilled Professionals, Approved CVs, Interview
// Requests, Job Matches, Outreach, Partner Handoff) are added alongside this
// page as each phase ships.
class SkilledWorkerMobility extends Page
{
    protected static ?string $navigationIcon  = 'heroicon-o-globe-alt';
    protected static ?string $navigationLabel = 'Overview';
    protected static ?string $navigationGroup = 'Skilled Professional Mobility';
    protected static ?int    $navigationSort  = 1;
    protected static string  $view            = 'filament.pages.skilled-worker-mobility';

    public function getTitle(): string
    {
        return 'Skilled Professional Mobility';
    }

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }
}
