<?php

namespace App\Filament\Resources;

use App\Filament\Resources\InstitutionSelectionResource\Pages;
use App\Filament\Resources\ApplicationResource;
use App\Models\InstitutionSelection;
use Filament\Forms\Form;
use Filament\Infolists\Components\Section;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Components\Grid;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
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
                    ->color('primary')
                    ->url(fn (InstitutionSelection $r) =>
                        $r->lead_id ? ApplicationResource::getUrl('view', ['record' => $r->lead_id]) : null)
                    ->openUrlInNewTab()
                    ->description(fn (InstitutionSelection $r) =>
                        implode(' · ', array_filter([
                            $r->lead?->formTemplate?->country,
                            $r->lead?->formTemplate?->name,
                        ]))),

                Tables\Columns\TextColumn::make('lead.user.name')
                    ->label('Student')
                    ->searchable()
                    ->default('—')
                    ->description(fn (InstitutionSelection $r) =>
                        $r->lead?->submitted_at?->format('d M Y') ?? '—'),

                Tables\Columns\TextColumn::make('institution.name')
                    ->label('Institution')
                    ->searchable()
                    ->weight('semibold')
                    ->description(fn (InstitutionSelection $r) =>
                        $r->connect_email ?? '—'),

                Tables\Columns\TextColumn::make('connect_name')
                    ->label('Contact Person')
                    ->searchable()
                    ->description(fn (InstitutionSelection $r): \Illuminate\Support\HtmlString => new \Illuminate\Support\HtmlString(
                        collect([
                            $r->connect_whatsapp
                                ? '<a href="https://wa.me/' . preg_replace('/\D/', '', $r->connect_whatsapp) . '" target="_blank" style="color:#16a34a;font-weight:600;">📱 ' . e($r->connect_whatsapp) . '</a>'
                                : null,
                            $r->connect_phone
                                ? '<a href="tel:' . e($r->connect_phone) . '" style="color:#2563eb;">📞 ' . e($r->connect_phone) . '</a>'
                                : null,
                            $r->connect_email
                                ? '<a href="mailto:' . e($r->connect_email) . '" style="color:#7c3aed;">✉ ' . e($r->connect_email) . '</a>'
                                : null,
                        ])->filter()->join(' &nbsp;·&nbsp; ') ?: '—'
                    )),

                Tables\Columns\TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->color(fn ($state) => match ($state ?? '') {
                        'selected'    => 'info',
                        'accepted'    => 'warning',
                        'processing'  => 'primary',
                        'complete'    => 'success',
                        'incomplete'  => 'danger',
                        'rejected'    => 'danger',
                        'cancelled'   => 'gray',
                        default       => 'gray',
                    })
                    ->formatStateUsing(fn ($state) => match ($state ?? '') {
                        'selected'    => 'Selected',
                        'accepted'    => 'Accepted',
                        'processing'  => 'Processing',
                        'complete'    => 'Complete',
                        'incomplete'  => 'Incomplete',
                        'rejected'    => 'Rejected',
                        'cancelled'   => 'Cancelled',
                        default       => ucfirst($state ?? ''),
                    }),

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
                        'selected'   => 'Selected',
                        'accepted'   => 'Accepted',
                        'processing' => 'Processing',
                        'complete'   => 'Complete',
                        'incomplete' => 'Incomplete',
                        'rejected'   => 'Rejected',
                        'cancelled'  => 'Cancelled',
                    ])
                    ->native(false),
            ])
            ->actions([
                // View full student profile in a modal
                Tables\Actions\Action::make('view_student')
                    ->label('Student Details')
                    ->icon('heroicon-o-user-circle')
                    ->color('gray')
                    ->modalHeading(fn (InstitutionSelection $r) => $r->lead?->user?->name ?? 'Student Details')
                    ->modalDescription(fn (InstitutionSelection $r) => $r->lead?->application_code)
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->infolist(fn (InstitutionSelection $r, Infolist $infolist) =>
                        $infolist->record($r)->schema([
                            Section::make('Personal Information')->schema([
                                Grid::make(2)->schema([
                                    TextEntry::make('lead.user.name')->label('Full Name'),
                                    TextEntry::make('lead.user.email')->label('Email')->copyable(),
                                    TextEntry::make('lead.user.studentProfile.highest_qualification')->label('Education')->default('—'),
                                    TextEntry::make('lead.user.studentProfile.gpa')->label('GPA')->default('—'),
                                    TextEntry::make('lead.user.studentProfile.jlpt_level')->label('JLPT Level')->default('—'),
                                    TextEntry::make('lead.user.studentProfile.nat_level')->label('NAT Level')->default('—'),
                                ]),
                            ]),
                            Section::make('Application Target')->schema([
                                Grid::make(2)->schema([
                                    TextEntry::make('lead.formTemplate.country')->label('Country')->default('—'),
                                    TextEntry::make('lead.formTemplate.name')->label('Form / Course')->default('—'),
                                    TextEntry::make('lead.application_code')->label('App. Code')->fontFamily('mono')->copyable(),
                                    TextEntry::make('lead.submitted_at')->label('Submitted')->dateTime()->default('—'),
                                    TextEntry::make('status')->label('Selection Status')->badge()
                                        ->color(fn ($state) => match ($state) {
                                            'selected' => 'info', 'accepted' => 'warning',
                                            'processing' => 'primary', 'complete' => 'success',
                                            default => 'gray',
                                        }),
                                    TextEntry::make('selected_at')->label('Selected On')->date()->default('—'),
                                ]),
                            ]),
                        ])
                    ),

                // accepted → Start Processing
                Tables\Actions\Action::make('start_processing')
                    ->label('Start Processing')
                    ->icon('heroicon-o-arrow-right-circle')
                    ->color('primary')
                    ->requiresConfirmation()
                    ->modalHeading('Start Processing')
                    ->modalDescription('Both sides have agreed. This will move the application to active processing.')
                    ->modalSubmitActionLabel('Yes, Start Processing')
                    ->visible(fn (InstitutionSelection $r) => $r->status === 'accepted')
                    ->action(function (InstitutionSelection $r) {
                        $r->update(['status' => 'processing', 'processing_at' => now()]);
                        $r->lead?->update(['status' => 'processing']);
                        Notification::make()->title('Processing Started')->body('Application is now in active processing.')->success()->send();
                    }),

                // accepted → Reject (admin side)
                Tables\Actions\Action::make('admin_reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Reject Selection')
                    ->modalDescription('This will reject the selection. The institution will be able to revive it within 30 days.')
                    ->modalSubmitActionLabel('Yes, Reject')
                    ->visible(fn (InstitutionSelection $r) => in_array($r->status, ['selected', 'accepted']))
                    ->action(function (InstitutionSelection $r) {
                        $r->update(['status' => 'rejected', 'rejected_at' => now()]);
                        $r->lead?->update(['status' => 'pool']);
                        Notification::make()->title('Selection Rejected')->warning()->send();
                    }),

                // processing → Mark Complete
                Tables\Actions\Action::make('mark_complete')
                    ->label('Mark Complete')
                    ->icon('heroicon-o-check-badge')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Mark as Complete')
                    ->modalDescription('Confirm that the enrollment process has been successfully completed for this student.')
                    ->modalSubmitActionLabel('Yes, Mark Complete')
                    ->visible(fn (InstitutionSelection $r) => $r->status === 'processing')
                    ->action(function (InstitutionSelection $r) {
                        $r->update(['status' => 'complete', 'completed_at' => now()]);
                        $r->lead?->update(['status' => 'complete']);
                        Notification::make()->title('Marked Complete')->body('Enrollment process complete.')->success()->send();
                    }),

                // processing → Mark Incomplete
                Tables\Actions\Action::make('mark_incomplete')
                    ->label('Mark Incomplete')
                    ->icon('heroicon-o-exclamation-circle')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Mark as Incomplete')
                    ->modalDescription('Mark that the process broke down before completion. The institution may revive within 30 days.')
                    ->modalSubmitActionLabel('Yes, Mark Incomplete')
                    ->visible(fn (InstitutionSelection $r) => $r->status === 'processing')
                    ->action(function (InstitutionSelection $r) {
                        $r->update(['status' => 'incomplete', 'rejected_at' => now()]);
                        $r->lead?->update(['status' => 'pool']);
                        Notification::make()->title('Marked Incomplete')->warning()->send();
                    }),

                // Revive (cancelled/rejected/incomplete within 30 days)
                Tables\Actions\Action::make('admin_revive')
                    ->label('Revive')
                    ->icon('heroicon-o-arrow-path')
                    ->color('info')
                    ->requiresConfirmation()
                    ->modalHeading('Revive Application')
                    ->modalDescription('This will reset the selection back to "Selected" so the institution can re-engage.')
                    ->modalSubmitActionLabel('Yes, Revive')
                    ->visible(function (InstitutionSelection $r) {
                        if (!in_array($r->status, ['cancelled', 'rejected', 'incomplete'])) return false;
                        $ts = $r->rejected_at ?? $r->selected_at;
                        return $ts && $ts->diffInDays(now()) <= 30;
                    })
                    ->action(function (InstitutionSelection $r) {
                        $r->update(['status' => 'selected', 'rejected_at' => null]);
                        $r->lead?->update(['status' => 'pool']);
                        Notification::make()->title('Application Revived')->body('Selection reset to Selected.')->success()->send();
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
