<?php

namespace App\Filament\Widgets;

use App\Models\Lead;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class RecentLeadsWidget extends BaseWidget
{
    protected static ?string $heading = 'Recent Applicants';
    protected static ?int $sort = 4;
    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Lead::with(['student:id,name', 'sourceAgency:id,name'])
                    ->latest()
                    ->limit(8)
            )
            ->columns([
                Tables\Columns\TextColumn::make('lead_code')
                    ->label('Applicant')
                    ->searchable()
                    ->weight('bold')
                    ->color('primary'),

                Tables\Columns\TextColumn::make('student.name')
                    ->label('Student')
                    ->searchable(),

                Tables\Columns\TextColumn::make('sourceAgency.name')
                    ->label('Agency')
                    ->default('—')
                    ->color('gray'),

                Tables\Columns\TextColumn::make('target_country')
                    ->label('Country')
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('pool_type')
                    ->label('Pool')
                    ->badge()
                    ->color(fn (string $state) => $state === 'open' ? 'success' : 'gray'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'new'                           => 'gray',
                        'profile_complete', 'under_review' => 'info',
                        'shortlisted', 'interview_scheduled' => 'warning',
                        'interviewed', 'offer_received'    => 'primary',
                        'accepted', 'visa_processing'      => 'success',
                        'visa_approved', 'enrolled'        => 'success',
                        'visa_rejected', 'closed'          => 'danger',
                        default                            => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => ucwords(str_replace('_', ' ', $state))),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->since()
                    ->color('gray'),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->url(fn (Lead $record) => \App\Filament\Resources\LeadResource::getUrl('edit', ['record' => $record]))
                    ->icon('heroicon-m-eye')
                    ->size('sm'),
            ])
            ->paginated(false);
    }
}
