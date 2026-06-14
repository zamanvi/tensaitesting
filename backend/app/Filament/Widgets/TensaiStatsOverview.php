<?php

namespace App\Filament\Widgets;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\OcrJob;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class TensaiStatsOverview extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $today = now();
        $weekAgo = $today->copy()->subDays(7);

        $studentChartData = $this->dailyCounts('users', 'gateway_type', 'student');
        $leadChartData = $this->dailyLeadCounts();
        $ocrChartData = $this->dailyOcrCounts();

        $newStudentsThisWeek = User::where('gateway_type', 'student')
            ->where('created_at', '>=', $weekAgo)->count();

        $newLeadsThisWeek = Lead::where('created_at', '>=', $weekAgo)->count();

        $pendingCommissions = Commission::where('status', 'due')->sum('amount');

        $institutionCount = User::where('gateway_type', 'institution')->count();

        return [
            Stat::make('Total Students', User::where('gateway_type', 'student')->count())
                ->description("+{$newStudentsThisWeek} this week")
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->chart($studentChartData)
                ->color('info')
                ->icon('heroicon-o-academic-cap'),

            Stat::make('Active Applicants', Lead::whereNotIn('status', ['closed', 'enrolled'])->count())
                ->description("+{$newLeadsThisWeek} this week")
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->chart($leadChartData)
                ->color('warning')
                ->icon('heroicon-o-users'),

            Stat::make('Enrolled Students', Lead::where('status', 'enrolled')->count())
                ->description('Successfully placed')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success')
                ->icon('heroicon-o-check-badge'),

            Stat::make('OCR Review Queue', OcrJob::where('status', 'review_requested')->count())
                ->description(OcrJob::where('status', 'review_requested')->count() > 0 ? 'Needs attention' : 'All clear')
                ->descriptionIcon(OcrJob::where('status', 'review_requested')->count() > 0 ? 'heroicon-m-exclamation-triangle' : 'heroicon-m-check-circle')
                ->chart($ocrChartData)
                ->color(OcrJob::where('status', 'review_requested')->count() > 0 ? 'danger' : 'success')
                ->icon('heroicon-o-document-magnifying-glass'),

            Stat::make('Partner Agencies', User::where('gateway_type', 'agency')->count())
                ->description("{$institutionCount} institutions connected")
                ->descriptionIcon('heroicon-m-building-office-2')
                ->color('primary')
                ->icon('heroicon-o-building-office'),

            Stat::make('Commissions Due', '৳ ' . number_format($pendingCommissions, 0))
                ->description(Commission::where('status', 'due')->count() . ' pending payments')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color($pendingCommissions > 0 ? 'danger' : 'success')
                ->icon('heroicon-o-banknotes'),
        ];
    }

    private function dailyCounts(string $table, string $column, string $value): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $data[] = \DB::table($table)
                ->where($column, $value)
                ->whereDate('created_at', $date)
                ->whereNull('deleted_at')
                ->count();
        }
        return $data;
    }

    private function dailyLeadCounts(): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $data[] = Lead::whereDate('created_at', $date)->count();
        }
        return $data;
    }

    private function dailyOcrCounts(): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $data[] = OcrJob::whereDate('created_at', $date)->count();
        }
        return $data;
    }
}
