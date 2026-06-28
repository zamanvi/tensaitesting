<?php

namespace App\Filament\Widgets;

use App\Models\Application;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ApplicationStatsWidget extends BaseWidget
{
    protected static bool $isLazy = false;

    protected function getStats(): array
    {
        $total     = Application::count();
        $submitted = Application::where('status', 'submitted')->count();
        $accepted  = Application::where('status', 'accepted')->count();
        $rate      = $total > 0 ? round($accepted / $total * 100) : 0;

        return [
            Stat::make('Total Applications', $total)
                ->description('All time records')
                ->descriptionIcon('heroicon-o-document-text')
                ->color('gray'),

            Stat::make('Pending Review', $submitted)
                ->description('Awaiting decision')
                ->descriptionIcon('heroicon-o-clock')
                ->color('warning'),

            Stat::make('Accepted', $accepted)
                ->description("{$rate}% acceptance rate")
                ->descriptionIcon('heroicon-o-check-circle')
                ->color('success'),

            Stat::make('This Month', Application::whereMonth('created_at', now()->month)->count())
                ->description('New applications')
                ->descriptionIcon('heroicon-o-calendar-days')
                ->color('info'),
        ];
    }
}
