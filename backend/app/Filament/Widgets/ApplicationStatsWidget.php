<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\ApplicationResource;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class ApplicationStatsWidget extends BaseWidget
{
    protected static bool $isLazy = false;
    protected static ?string $pollingInterval = null;

    protected function getStats(): array
    {
        // Count from the same query the list below uses, so a branch or agency
        // user only ever sees numbers for the applications they can open.
        // A Job CV is not an application, so it is not counted here either.
        $scope = fn () => ApplicationResource::getEloquentQuery()->withoutJobCvs()->toBase();

        $total     = $scope()->count();
        $submitted = $scope()->where('status', 'submitted')->count();
        $accepted  = $scope()->where('status', 'accepted')->count();
        $rate      = $total > 0 ? round($accepted / $total * 100) : 0;
        $thisMonth = $scope()
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

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

            Stat::make('This Month', $thisMonth)
                ->description('New applications')
                ->descriptionIcon('heroicon-o-calendar-days')
                ->color('info'),
        ];
    }
}
