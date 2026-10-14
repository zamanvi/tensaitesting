<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ApprovedCvResource\Pages;
use App\Models\CvAccess;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

// "Approved CVs": the CVs staff have checked and approved. One row per person,
// the same CV record that is edited under Skilled Professionals, so nothing is
// copied. Everything that is still being filled in or waiting for review stays
// in Skilled Professionals. Employers are NOT shown anything from here by
// itself: a CV is only visible outside through the share link staff switch on.
class ApprovedCvResource extends Resource
{
    protected static ?string $model                = CvAccess::class;
    protected static ?string $modelLabel           = 'Approved CV';
    protected static ?string $pluralModelLabel     = 'Approved CVs';
    protected static ?string $navigationIcon       = 'heroicon-o-check-badge';
    protected static ?string $navigationLabel      = 'Approved CVs';
    protected static ?string $navigationGroup      = 'Skilled Professional Mobility';
    protected static ?int    $navigationSort       = 3;
    protected static ?string $slug                 = 'approved-cvs';

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin'])
            || \App\Filament\Support\ManagerAccess::granted(static::class);
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereNotNull('sent_at')
            ->with(['candidate', 'user', 'application']);
    }

    // Value of one CV answer, falling back to what the chat collected.
    private static function answer(CvAccess $record, string $key, ?string $fallback = null): ?string
    {
        $value = $record->application?->form_data[$key] ?? null;
        $value = is_scalar($value) ? trim((string) $value) : '';

        return $value !== '' ? $value : ($fallback ?: null);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('candidate.code')
                    ->label('Ref')
                    ->extraHeaderAttributes(['title' => 'Reference code. Quote it to the person and to employers.', 'style' => 'cursor: help'])
                    ->searchable()
                    ->copyable()
                    ->copyMessage('Reference copied')
                    ->fontFamily('mono'),

                Tables\Columns\TextColumn::make('candidate.full_name')
                    ->label('Name')
                    ->searchable()
                    ->weight('bold')
                    ->placeholder('No name'),

                Tables\Columns\TextColumn::make('job')
                    ->label('Job')
                    ->extraHeaderAttributes(['title' => 'The work the person does or wants, from their CV.', 'style' => 'cursor: help'])
                    ->getStateUsing(fn (CvAccess $r) => static::answer($r, 'desired_job', $r->candidate?->role))
                    ->placeholder('Not told'),

                Tables\Columns\TextColumn::make('experience')
                    ->label('Experience')
                    ->getStateUsing(fn (CvAccess $r) => static::answer($r, 'experience', $r->candidate?->experience))
                    ->placeholder('Not told')
                    ->toggleable(),

                Tables\Columns\TextColumn::make('country')
                    ->label('Country')
                    ->extraHeaderAttributes(['title' => 'The country the person wants to work in.', 'style' => 'cursor: help'])
                    ->getStateUsing(fn (CvAccess $r) => static::answer($r, 'target_country', $r->candidate?->target_country))
                    ->placeholder('Not told')
                    ->toggleable(),

                Tables\Columns\IconColumn::make('link_live')
                    ->label('Share link')
                    ->extraHeaderAttributes(['title' => 'Is the shareable CV link switched on? It shows a short name, the reference and an age, never phone or e-mail.', 'style' => 'cursor: help'])
                    ->boolean()
                    ->getStateUsing(fn (CvAccess $r) => $r->publicLinkIsLive()),

                Tables\Columns\TextColumn::make('status')
                    ->label('My CV')
                    ->extraHeaderAttributes(['title' => 'Active = the person can still use the assistant. Paused = switched off in CV settings. An approved CV stays here either way.', 'style' => 'cursor: help'])
                    ->badge()
                    ->formatStateUsing(fn (string $state) => CvAccess::STATUSES[$state] ?? $state)
                    ->color(fn (string $state) => $state === 'active' ? 'success' : 'gray')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('sent_at')
                    ->label('Approved')
                    ->extraHeaderAttributes(['title' => 'When staff approved this CV. Hover a value to see the date and time in Dhaka.', 'style' => 'cursor: help'])
                    ->since()
                    ->tooltip(fn (CvAccess $r) => $r->sent_at?->setTimezone('Asia/Dhaka')->format('d M Y, h:i A') . ' (Dhaka)')
                    ->sortable(),
            ])
            ->defaultSort('sent_at', 'desc')
            ->emptyStateIcon('heroicon-o-check-badge')
            ->emptyStateHeading('No approved CVs yet')
            ->emptyStateDescription('Check a CV in Skilled Professionals, then press "Approve CV". It appears here.')
            ->filters([
                Tables\Filters\TernaryFilter::make('link')
                    ->label('Share link')
                    ->placeholder('All')
                    ->trueLabel('Switched on')
                    ->falseLabel('Switched off')
                    ->queries(
                        true: fn (Builder $q) => $q->where('public_enabled', true)->whereNotNull('share_consent_at'),
                        false: fn (Builder $q) => $q->where(fn ($w) => $w->where('public_enabled', false)->orWhereNull('share_consent_at')),
                        blank: fn (Builder $q) => $q,
                    ),
            ])
            ->actions([
                // Exactly what the person sees in My CV → Preview.
                Tables\Actions\Action::make('preview_cv')
                    ->label('Preview CV')
                    ->icon('heroicon-o-eye')
                    ->modalHeading('CV preview')
                    ->modalContent(fn (CvAccess $record) => view('filament.cv-preview', [
                        'preview' => \App\Support\CvPreview::build($record->load(['application', 'candidate'])),
                    ]))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Close'),

                Tables\Actions\Action::make('edit_cv')
                    ->label('Edit CV')
                    ->icon('heroicon-o-pencil-square')
                    ->color('primary')
                    ->visible(fn (CvAccess $record) => (bool) $record->application_id)
                    ->slideOver()
                    ->modalWidth('3xl')
                    ->modalHeading('Edit CV')
                    ->modalDescription('Change anything the person answered. Empty a box to remove that answer. Changes show at once in the person\'s My CV, the preview and the share link.')
                    ->form(fn (CvAccess $record) => \App\Filament\Support\CvEditForm::schema($record->load(['application', 'candidate'])))
                    ->fillForm(fn (CvAccess $record) => \App\Filament\Support\CvEditForm::values($record->load(['application', 'candidate'])))
                    ->modalSubmitActionLabel('Save CV')
                    ->action(function (CvAccess $record, array $data) {
                        \App\Filament\Support\CvEditForm::save($record->load(['application', 'candidate']), $data);

                        Notification::make()->title('CV saved')->success()->send();
                    }),

                // Switch the shareable CV link on/off and copy it.
                Tables\Actions\Action::make('share_link')
                    ->label('Share link')
                    ->icon('heroicon-o-link')
                    ->modalHeading('Shareable CV link')
                    ->modalDescription('Shows the CV with a short name, the reference code and an age, never the phone number or e-mail. Employers contact Tensai, quoting the reference.')
                    ->visible(fn (CvAccess $record) => $record->canShare())
                    ->fillForm(fn (CvAccess $record) => [
                        'public_enabled' => (bool) $record->public_enabled,
                        'url'            => $record->publicUrl() ?? '',
                    ])
                    ->form([
                        Forms\Components\Toggle::make('public_enabled')->label('Link is on'),
                        Forms\Components\TextInput::make('url')
                            ->label('Link')
                            ->readOnly()
                            ->dehydrated(false)
                            ->extraInputAttributes(['onclick' => 'this.select(); navigator.clipboard && navigator.clipboard.writeText(this.value);'])
                            ->helperText('Click the link to copy it.')
                            ->placeholder('Switch the link on and save to create it'),
                    ])
                    ->modalSubmitActionLabel('Save')
                    ->action(function (CvAccess $record, array $data) {
                        if (! $record->canShare()) {
                            return;
                        }

                        $record->public_enabled = (bool) ($data['public_enabled'] ?? false);
                        $record->save();

                        if ($record->public_enabled) {
                            Notification::make()
                                ->title('Link is on')
                                ->body($record->ensureToken() ? $record->publicUrl() : '')
                                ->success()
                                ->persistent()
                                ->send();
                        } else {
                            Notification::make()->title('Link is off')->success()->send();
                        }
                    }),

                Tables\Actions\ActionGroup::make([
                    // The instructions + this CV as plain text, to paste into an
                    // AI chat when searching for job circulars. Contact details
                    // are never part of it.
                    Tables\Actions\Action::make('copy_for_ai')
                        ->label('Copy for AI')
                        ->icon('heroicon-o-clipboard-document')
                        ->visible(fn (CvAccess $record) => (bool) $record->candidate)
                        ->modalHeading('Copy for AI')
                        ->modalDescription(MobilityCandidateResource::aiPackDescription())
                        ->form(MobilityCandidateResource::aiPackForm())
                        ->fillForm(fn (CvAccess $record) => [
                            'pack' => \App\Support\JobSearchPack::build(collect([$record->candidate])),
                        ])
                        ->modalSubmitAction(false)
                        ->modalCancelActionLabel('Close'),

                    Tables\Actions\Action::make('open_candidate')
                        ->label('Skilled professional record')
                        ->icon('heroicon-o-identification')
                        ->visible(fn (CvAccess $record) => (bool) $record->mobility_candidate_id
                            && MobilityCandidateResource::canAccess())
                        ->url(fn (CvAccess $record) => MobilityCandidateResource::getUrl('edit', ['record' => $record->mobility_candidate_id])),

                    Tables\Actions\Action::make('open_cv')
                        ->label('Full application')
                        ->icon('heroicon-o-arrow-top-right-on-square')
                        ->visible(fn (CvAccess $record) => (bool) $record->application_id
                            && ApplicationResource::canAccess())
                        ->url(fn (CvAccess $record) => ApplicationResource::getUrl('edit', ['record' => $record->application_id])),

                    Tables\Actions\Action::make('cv_settings')
                        ->label('CV settings')
                        ->icon('heroicon-o-cog-6-tooth')
                        ->visible(fn () => CvAccessResource::canAccess())
                        ->url(fn (CvAccess $record) => CvAccessResource::getUrl('edit', ['record' => $record->getKey()])),

                    // Found something to correct: it goes back to review and the
                    // share link is switched off until it is approved again.
                    Tables\Actions\Action::make('back_to_review')
                        ->label('Back to review')
                        ->icon('heroicon-o-arrow-uturn-left')
                        ->color('warning')
                        ->requiresConfirmation()
                        ->modalHeading('Take this CV back to review?')
                        ->modalDescription('It leaves Approved CVs and goes back to "ready for review" in Skilled Professionals. The share link is switched off until you approve it again.')
                        ->action(function (CvAccess $record) {
                            $record->unapprove();

                            Notification::make()->title('CV is back in review')->success()->send();
                        }),
                ])
                    ->label('More')
                    ->icon('heroicon-m-ellipsis-vertical')
                    ->tooltip('Copy for AI, full record, CV settings, back to review'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    // Several CVs in one pack: one search can serve candidates
                    // with the same kind of job.
                    Tables\Actions\BulkAction::make('copy_for_ai')
                        ->label('Copy for AI (selected)')
                        ->icon('heroicon-o-clipboard-document')
                        ->modalHeading('Copy for AI')
                        ->modalDescription(MobilityCandidateResource::aiPackDescription() . ' At most ' . \App\Support\JobSearchPack::MAX_CANDIDATES . ' CVs go into one pack.')
                        ->form(MobilityCandidateResource::aiPackForm())
                        ->fillForm(fn (\Illuminate\Support\Collection $records) => [
                            'pack' => \App\Support\JobSearchPack::build($records->pluck('candidate')->filter()->values()),
                        ])
                        ->modalSubmitAction(false)
                        ->modalCancelActionLabel('Close')
                        ->deselectRecordsAfterCompletion(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListApprovedCvs::route('/'),
        ];
    }
}
