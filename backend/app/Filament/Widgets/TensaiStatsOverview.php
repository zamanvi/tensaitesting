<?php

namespace App\Filament\Widgets;

use App\Models\Lead;
use App\Models\OcrJob;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class TensaiStatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        return [
            Stat::make('Total Students', User::where('gateway_type', 'student')->count())
                ->description('Registered on platform')
                ->icon('heroicon-o-academic-cap')
                ->color('info'),

            Stat::make('Active Leads', Lead::whereNotIn('status', ['closed', 'enrolled'])->count())
                ->description('In pipeline')
                ->icon('heroicon-o-users')
                ->color('warning'),

            Stat::make('Enrolled Students', Lead::where('status', 'enrolled')->count())
                ->description('Successfully placed')
                ->icon('heroicon-o-check-badge')
                ->color('success'),

            Stat::make('OCR Review Queue', OcrJob::where('status', 'review_requested')->count())
                ->description('Needs manual review')
                ->icon('heroicon-o-document-magnifying-glass')
                ->color('danger'),

            Stat::make('Open Pool Leads', Lead::where('pool_type', 'open')->where('is_published', true)->count())
                ->description('Available to agencies')
                ->icon('heroicon-o-globe-alt')
                ->color('primary'),

            Stat::make('Partner Agencies', User::where('gateway_type', 'agency')->count())
                ->description('Vetted agencies')
                ->icon('heroicon-o-building-office')
                ->color('gray'),
        ];
    }
}
