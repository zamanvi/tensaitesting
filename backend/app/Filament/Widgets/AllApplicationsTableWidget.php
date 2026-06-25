<?php

namespace App\Filament\Widgets;

use App\Models\Application;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class AllApplicationsTableWidget extends BaseWidget
{
    protected static ?string $heading = 'All Applications';

    protected int | string | array $columnSpan = 'full';

    protected static ?int $sort = 10;

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Application::query()
                    ->with(['formTemplate', 'user', 'branch'])
                    ->latest()
            )
            ->columns([
                Tables\Columns\TextColumn::make('application_code')
                    ->label('Code')
                    ->fontFamily('mono')
                    ->searchable()
                    ->copyable()
                    ->size('sm'),

                Tables\Columns\TextColumn::make('student_name')
                    ->label('Student')
                    ->searchable()
                    ->description(fn (Application $r) => $r->student_email)
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('source')
                    ->label('Source')
                    ->badge()
                    ->getStateUsing(function (Application $r): string {
                        return match ($r->submitted_by_role) {
                            'branch_admin', 'branch_manager', 'branch' => 'Branch',
                            'agency'        => 'Agency',
                            'student'       => 'Student',
                            'individual'    => 'Individual',
                            'admin', 'super_admin' => 'Admin',
                            default         => 'Individual',
                        };
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'Branch'     => 'info',
                        'Agency'     => 'warning',
                        'Student'    => 'success',
                        'Individual' => 'purple',
                        'Admin'      => 'gray',
                        default      => 'gray',
                    }),

                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch / Agency')
                    ->getStateUsing(function (Application $r): string {
                        if ($r->branch) return $r->branch->name;
                        if ($r->user?->agencyProfile) return $r->user->agencyProfile->agency_name ?? 'Agency';
                        return '—';
                    })
                    ->color('gray')
                    ->size('sm'),

                Tables\Columns\TextColumn::make('formTemplate.country')
                    ->label('Country')
                    ->searchable(),

                Tables\Columns\TextColumn::make('form_data.intake')
                    ->label('Intake')
                    ->getStateUsing(fn (Application $r) => $r->form_data['intake'] ?? '—')
                    ->badge()
                    ->color('primary'),

                Tables\Columns\TextColumn::make('progress')
                    ->label('Progress')
                    ->suffix('%')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Status')
                    ->colors([
                        'gray'    => 'draft',
                        'warning' => 'submitted',
                        'success' => 'accepted',
                        'danger'  => 'rejected',
                    ]),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->date('d M Y')
                    ->sortable()
                    ->color('gray'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('submitted_by_role')
                    ->label('Source')
                    ->options([
                        'branch_admin'   => 'Branch',
                        'agency'         => 'Agency',
                        'student'        => 'Student',
                        'individual'     => 'Individual',
                        'admin'          => 'Admin',
                    ]),

                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft'     => 'Draft',
                        'submitted' => 'Submitted',
                        'accepted'  => 'Accepted',
                        'rejected'  => 'Rejected',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('open')
                    ->label('Open →')
                    ->icon('heroicon-o-arrow-top-right-on-square')
                    ->url(fn (Application $r) => \App\Filament\Resources\ApplicationResource::getUrl('edit', ['record' => $r]))
                    ->openUrlInNewTab(false)
                    ->color('success'),
            ])
            ->defaultSort('created_at', 'desc')
            ->striped()
            ->paginated([10, 25, 50]);
    }
}
