<?php

namespace App\Filament\Resources\MobilityCandidateResource\Pages;

use App\Filament\Resources\CvAccessResource;
use App\Filament\Resources\MobilityCandidateResource;
use App\Models\CvAccess;
use App\Models\MobilityCandidate;
use App\Models\User;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;

class ListMobilityCandidates extends ListRecords
{
    protected static string $resource = MobilityCandidateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            // Opens My CV for any free account. One person stays ONE record: if
            // the person is already in this list (a chat lead), pick that lead
            // and the account is joined to it instead of making another row.
            Actions\Action::make('open_my_cv')
                ->label('Open My CV for an account')
                ->icon('heroicon-o-document-plus')
                ->color('success')
                ->visible(fn () => CvAccessResource::canAccess())
                ->modalHeading('Open My CV for an account')
                ->modalDescription('The person gets the assistant and a draft CV. If they are already in this list, choose their entry so there is only one record for them.')
                ->form([
                    Forms\Components\Select::make('user_id')
                        ->label('Account')
                        ->required()
                        ->searchable()
                        ->live()
                        ->getSearchResultsUsing(fn (string $search) => CvAccessResource::searchStudents($search))
                        ->getOptionLabelUsing(fn ($value) => CvAccessResource::studentLabel($value))
                        ->helperText('Search by name, e-mail or phone.')
                        // Offer the lead automatically when phone number or e-mail match.
                        ->afterStateUpdated(function ($state, Forms\Set $set) {
                            $user = $state ? User::find($state) : null;
                            $lead = $user ? CvAccess::suggestCandidateFor($user) : null;
                            $set('candidate_id', $lead?->id);
                        }),

                    Forms\Components\Select::make('candidate_id')
                        ->label('Same person already in Talent Passports? (optional)')
                        ->searchable()
                        ->preload()
                        ->options(fn () => static::unlinkedLeads())
                        ->getSearchResultsUsing(fn (string $search) => static::unlinkedLeads($search))
                        ->placeholder('No — create a new entry')
                        ->helperText('If the right lead is filled in already, keep it: their chat answers are copied into the CV and no second row is made. Clear the box to create a new entry.'),
                ])
                ->modalSubmitActionLabel('Open My CV')
                ->action(function (array $data) {
                    $user = User::where('gateway_type', 'student')->find($data['user_id']);
                    if (! $user) {
                        Notification::make()->title('Account not found')->danger()->send();

                        return;
                    }

                    $lead = ! empty($data['candidate_id'])
                        ? MobilityCandidate::doesntHave('cvAccess')->find($data['candidate_id'])
                        : null;

                    try {
                        CvAccess::activateFor($user, auth()->user(), $lead);
                    } catch (\InvalidArgumentException $e) {
                        Notification::make()->title('Could not join them')->body($e->getMessage())->danger()->send();

                        return;
                    }

                    Notification::make()
                        ->title('My CV opened for ' . $user->name)
                        ->body($lead ? 'Joined to the existing entry ' . $lead->code . '.' : null)
                        ->success()
                        ->send();
                }),
            Actions\CreateAction::make()->label('Add candidate'),
        ];
    }

    // Leads that are not yet joined to an account, labelled so staff can tell
    // people apart: reference, name, phone, job.
    public static function unlinkedLeads(?string $search = null): array
    {
        return MobilityCandidate::query()
            ->doesntHave('cvAccess')
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('full_name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->orderByDesc('id')
            ->limit(30)
            ->get()
            ->mapWithKeys(fn (MobilityCandidate $c) => [
                $c->id => trim($c->code . ' — ' . ($c->full_name ?: 'no name') . ($c->phone ? ' — ' . $c->phone : '') . ($c->role ? ' — ' . $c->role : '')),
            ])
            ->all();
    }
}
