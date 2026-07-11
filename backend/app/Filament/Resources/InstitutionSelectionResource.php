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
                    ->description(fn (InstitutionSelection $r) => $r->connect_email ?? '—'),

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
                Tables\Actions\ActionGroup::make([
                // Contact Person card
                Tables\Actions\Action::make('contact_person')
                    ->label('Contact')
                    ->icon('heroicon-o-phone')
                    ->color('success')
                    ->modalHeading('📇 Contact Person')
                    ->modalDescription('Click any card below to connect instantly')
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close')
                    ->modalWidth('sm')
                    ->modalContent(fn (InstitutionSelection $r): \Illuminate\Support\HtmlString =>
                        self::buildContactCard($r)
                    ),

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

                ])->tooltip('Actions')->icon('heroicon-m-ellipsis-horizontal'),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListInstitutionSelections::route('/'),
        ];
    }

    protected static function buildContactCard(InstitutionSelection $r): \Illuminate\Support\HtmlString
    {
        $initial      = strtoupper(substr($r->connect_name ?? 'R', 0, 1));
        $name         = e($r->connect_name ?? '—');
        $institution  = e($r->institution?->name ?? '');
        $waNum        = preg_replace('/\D/', '', $r->connect_whatsapp ?? '');
        $wa           = e($r->connect_whatsapp ?? '');
        $phone        = e($r->connect_phone ?? '');
        $email        = e($r->connect_email ?? '');

        $html  = '<div style="display:flex;flex-direction:column;gap:12px;padding:4px 0;">';

        // Identity card
        $html .= '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:4px;">';
        $html .= '<div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:800;flex-shrink:0;">' . $initial . '</div>';
        $html .= '<div>';
        $html .= '<p style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 4px;">' . $name . '</p>';
        $html .= '<span style="font-size:11px;font-weight:600;color:#7c3aed;background:#ede9fe;padding:2px 8px;border-radius:99px;display:inline-block;">Institution Representative</span>';
        if ($institution) $html .= '<p style="font-size:11px;color:#64748b;margin:4px 0 0;">' . $institution . '</p>';
        $html .= '</div></div>';

        // WhatsApp
        if ($wa) {
            $html .= '<a href="https://wa.me/' . $waNum . '" target="_blank" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;text-decoration:none;">';
            $html .= '<span style="font-size:22px;">📱</span>';
            $html .= '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#15803d;margin:0 0 2px;">WhatsApp</p><p style="font-size:14px;font-weight:700;color:#14532d;margin:0;">' . $wa . '</p></div>';
            $html .= '<span style="margin-left:auto;font-size:18px;color:#15803d;">↗</span></a>';
        }

        // Phone
        if ($phone) {
            $html .= '<a href="tel:' . $phone . '" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;text-decoration:none;">';
            $html .= '<span style="font-size:22px;">📞</span>';
            $html .= '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1d4ed8;margin:0 0 2px;">Phone</p><p style="font-size:14px;font-weight:700;color:#1e3a8a;margin:0;">' . $phone . '</p></div>';
            $html .= '<span style="margin-left:auto;font-size:18px;color:#1d4ed8;">↗</span></a>';
        }

        // Email
        if ($email) {
            $html .= '<a href="mailto:' . $email . '" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#faf5ff;border:1.5px solid #e9d5ff;border-radius:12px;text-decoration:none;">';
            $html .= '<span style="font-size:22px;">✉️</span>';
            $html .= '<div><p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7c3aed;margin:0 0 2px;">Email</p><p style="font-size:14px;font-weight:700;color:#4c1d95;margin:0;">' . $email . '</p></div>';
            $html .= '<span style="margin-left:auto;font-size:18px;color:#7c3aed;">↗</span></a>';
        }

        if (!$wa && !$phone && !$email) {
            $html .= '<p style="text-align:center;color:#9ca3af;padding:20px;">No contact details available.</p>';
        }

        $html .= '</div>';

        return new \Illuminate\Support\HtmlString($html);
    }
}
