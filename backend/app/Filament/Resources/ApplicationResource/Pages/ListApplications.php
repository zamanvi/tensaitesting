<?php

namespace App\Filament\Resources\ApplicationResource\Pages;

use App\Filament\Resources\ApplicationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListApplications extends ListRecords
{
    protected static string $resource = ApplicationResource::class;

    public function getTitle(): string
    {
        $user = auth()->user();
        if ($user?->hasRole(['super_admin', 'admin'])) return 'All Applications';
        if ($user?->hasRole('branch_admin'))            return 'Branch Applications';
        return 'Applications';
    }

    public function getSubheading(): ?string
    {
        $user = auth()->user();
        if ($user?->hasRole(['super_admin', 'admin'])) {
            return 'Every application submitted across all branches, agencies and students.';
        }
        if ($user?->hasRole('branch_admin')) {
            return 'Applications submitted by your branch.';
        }
        return null;
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make()
                ->label('New Application')
                ->icon('heroicon-o-plus')
                ->color('success'),
        ];
    }

    public function getHeaderWidgets(): array
    {
        return [
            \App\Filament\Widgets\ApplicationStatsWidget::class,
        ];
    }
}
