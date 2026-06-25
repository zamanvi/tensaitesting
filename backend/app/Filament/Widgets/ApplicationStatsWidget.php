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
        $drafts    = Application::where('status', 'draft')->count();
        $submitted = Application::where('status', 'submitted')->count();
        $accepted  = Application::where('status', 'accepted')->count();
        $rejected  = Application::where('status', 'rejected')->count();

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
                ->description($total > 0 ? round($accepted / $total * 100) . '% success rate' : 'No applications yet')
                ->descriptionIcon('heroicon-o-check-circle')
                ->color('success'),

            Stat::make('Drafts', $drafts)
                ->description('Incomplete applications')
                ->descriptionIcon('heroicon-o-pencil-square')
                ->color('info'),
        ];
    }
}
