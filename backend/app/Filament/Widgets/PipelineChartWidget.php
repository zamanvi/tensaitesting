<?php

namespace App\Filament\Widgets;

use App\Models\Lead;
use Filament\Widgets\ChartWidget;
use Illuminate\Support\Facades\DB;

class PipelineChartWidget extends ChartWidget
{
    protected static ?string $heading = 'Applicant Pipeline';
    protected static ?int $sort = 2;
    protected static ?string $maxHeight = '280px';
    protected int | string | array $columnSpan = 2;

    protected function getData(): array
    {
        $statuses = [
            'new'                 => 'New',
            'profile_complete'    => 'Profile Complete',
            'under_review'        => 'Under Review',
            'shortlisted'         => 'Shortlisted',
            'interview_scheduled' => 'Interview Scheduled',
            'interviewed'         => 'Interviewed',
            'offer_received'      => 'Offer Received',
            'accepted'            => 'Accepted',
            'visa_processing'     => 'Visa Processing',
            'visa_approved'       => 'Visa Approved',
            'enrolled'            => 'Enrolled',
        ];

        $counts = Lead::whereNotIn('status', ['closed', 'on_hold'])
            ->whereNull('deleted_at')
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $data   = array_map(fn ($key) => $counts[$key] ?? 0, array_keys($statuses));
        $labels = array_values($statuses);

        return [
            'datasets' => [
                [
                    'label'           => 'Applicants',
                    'data'            => $data,
                    'backgroundColor' => [
                        '#94a3b8', '#60a5fa', '#facc15', '#fb923c',
                        '#a78bfa', '#818cf8', '#34d399', '#10b981',
                        '#22d3ee', '#3b82f6', '#22c55e',
                    ],
                    'borderWidth' => 0,
                ],
            ],
            'labels' => $labels,
        ];
    }

    protected function getType(): string
    {
        return 'bar';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => ['display' => false],
            ],
            'scales' => [
                'x' => [
                    'ticks' => ['maxRotation' => 45, 'font' => ['size' => 10]],
                    'grid'  => ['display' => false],
                ],
                'y' => [
                    'beginAtZero' => true,
                    'ticks'       => ['stepSize' => 1],
                    'grid'        => ['color' => 'rgba(148,163,184,0.1)'],
                ],
            ],
        ];
    }
}
