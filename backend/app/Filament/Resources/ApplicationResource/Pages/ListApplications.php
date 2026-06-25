<?php

namespace App\Filament\Resources\ApplicationResource\Pages;

use App\Filament\Resources\ApplicationResource;
use App\Models\Application;
use Filament\Actions;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;
use Filament\Pages\Concerns\ExposesTableToWidgets;
use Illuminate\Database\Eloquent\Builder;

class ListApplications extends ListRecords
{
    protected static string $resource = ApplicationResource::class;

    public function getTitle(): string
    {
        $user = auth()->user();
        if ($user?->hasRole(['super_admin', 'admin'])) {
            return 'All Applications';
        }
        if ($user?->hasRole('branch_admin')) {
            return 'Branch Applications';
        }
        return 'Applications';
    }

    public function getSubheading(): ?string
    {
        $user = auth()->user();
        if ($user?->hasRole(['super_admin', 'admin'])) {
            return 'Every application submitted across all branches, agencies and students — you can accept, reject, edit or delete any record.';
        }
        if ($user?->hasRole('branch_admin')) {
            return 'Applications submitted by your branch. You can create new applications, edit drafts, and track submission status.';
        }
        return null;
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('All')
                ->icon('heroicon-o-inbox-stack'),

            'draft' => Tab::make('Drafts')
                ->icon('heroicon-o-pencil-square')
                ->badge(fn () => $this->getResource()::getEloquentQuery()->where('status', 'draft')->count())
                ->badgeColor('gray')
                ->modifyQueryUsing(fn (Builder $q) => $q->where('status', 'draft')),

            'submitted' => Tab::make('Submitted')
                ->icon('heroicon-o-paper-airplane')
                ->badge(fn () => $this->getResource()::getEloquentQuery()->where('status', 'submitted')->count())
                ->badgeColor('warning')
                ->modifyQueryUsing(fn (Builder $q) => $q->where('status', 'submitted')),

            'accepted' => Tab::make('Accepted')
                ->icon('heroicon-o-check-circle')
                ->badge(fn () => $this->getResource()::getEloquentQuery()->where('status', 'accepted')->count())
                ->badgeColor('success')
                ->modifyQueryUsing(fn (Builder $q) => $q->where('status', 'accepted')),

            'rejected' => Tab::make('Rejected')
                ->icon('heroicon-o-x-circle')
                ->badge(fn () => $this->getResource()::getEloquentQuery()->where('status', 'rejected')->count())
                ->badgeColor('danger')
                ->modifyQueryUsing(fn (Builder $q) => $q->where('status', 'rejected')),
        ];
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
