<?php

namespace App\Filament\Resources\ApplicationResource\Pages;

use App\Filament\Resources\ApplicationResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListApplications extends ListRecords
{
    protected static string $resource = ApplicationResource::class;

    // Job CVs that are still being filled in, or waiting for staff review, are
    // kept out of this list (they live in Talent Passports until "Sent to All
    // Applications"). Only the LIST is filtered, so a CV can still be opened
    // by its link from Talent Passports / CV Access.
    protected function getTableQuery(): ?\Illuminate\Database\Eloquent\Builder
    {
        return parent::getTableQuery()?->withoutUnsentJobCvs();
    }

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
