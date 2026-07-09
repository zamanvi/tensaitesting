<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InstitutionSelectionResource\Pages;
use App\Models\InstitutionSelection;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class InstitutionSelectionResource extends Resource
{
    protected static ?string $model           = InstitutionSelection::class;
    protected static ?string $navigationIcon  = 'heroicon-o-star';
    protected static ?string $navigationLabel = 'Selected';
    protected static ?string $navigationGroup = 'Applicant Management';
    protected static ?int    $navigationSort  = 2;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('lead.application_code')
                    ->label('App. Code')
                    ->fontFamily('mono')
                    ->weight('bold')
                    ->searchable()
                    ->copyable()
                    ->description(fn (InstitutionSelection $r) =>
                        $r->lead?->formTemplate?->country ?? '—'),

                Tables\Columns\TextColumn::make('institution.name')
                    ->label('Institution')
                    ->searchable()
                    ->weight('semibold')
                    ->description(fn (InstitutionSelection $r) =>
                        $r->connect_email ?? '—'),

                Tables\Columns\TextColumn::make('connect_name')
                    ->label('Contact Person')
                    ->searchable()
                    ->description(fn (InstitutionSelection $r) =>
                        collect([$r->connect_whatsapp, $r->connect_phone])->filter()->join(' / ') ?: '—'),

                Tables\Columns\TextColumn::make('lead.status')
                    ->label('App. Status')
                    ->badge()
                    ->color(fn ($state) => match ($state ?? '') {
                        'selected' => 'info',
                        'accepted' => 'success',
                        'rejected' => 'danger',
                        default    => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => ucfirst($state ?? '')),

                Tables\Columns\TextColumn::make('status')
                    ->label('Selection Status')
                    ->badge()
                    ->color(fn ($state) => match ($state ?? '') {
                        'selected' => 'info',
                        'accepted' => 'success',
                        'rejected' => 'danger',
                        default    => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => ucfirst($state ?? '')),

                Tables\Columns\TextColumn::make('selected_at')
                    ->label('Selected')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('selected_at', 'desc')
            ->paginated([15, 25, 50])
            ->emptyStateHeading('No selections yet')
            ->emptyStateDescription('Institutions have not selected any applications from the pool yet.')
            ->emptyStateIcon('heroicon-o-star')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'selected' => 'Selected',
                        'accepted' => 'Accepted',
                        'rejected' => 'Rejected',
                    ])
                    ->native(false),
            ])
            ->actions([
                Tables\Actions\Action::make('accept')
                    ->label('Accept')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (InstitutionSelection $r) => $r->status === 'selected')
                    ->action(function (InstitutionSelection $r) {
                        $r->update(['status' => 'accepted']);
                        \Filament\Notifications\Notification::make()
                            ->title('Selection Accepted')
                            ->success()->send();
                    }),

                Tables\Actions\Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (InstitutionSelection $r) => $r->status === 'selected')
                    ->action(function (InstitutionSelection $r) {
                        $r->update(['status' => 'rejected']);
                        \Filament\Notifications\Notification::make()
                            ->title('Selection Rejected')
                            ->warning()->send();
                    }),

                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListInstitutionSelections::route('/'),
        ];
    }
}
