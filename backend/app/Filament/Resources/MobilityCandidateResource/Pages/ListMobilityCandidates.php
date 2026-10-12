<?php

namespace App\Filament\Resources\MobilityCandidateResource\Pages;

use App\Filament\Resources\CvAccessResource;
use App\Filament\Resources\MobilityCandidateResource;
use App\Models\CvAccess;
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
            // Opens My CV for any free account, with or without a chat lead
            // (the row button only appears when the phone numbers match).
            Actions\Action::make('open_my_cv')
                ->label('Open My CV for an account')
                ->icon('heroicon-o-document-plus')
                ->color('success')
                ->visible(fn () => CvAccessResource::canAccess())
                ->modalHeading('Open My CV for an account')
                ->modalDescription('The person gets the assistant and a draft CV. Their chat answers are copied in if the phone number matches a chat lead.')
                ->form([
                    Forms\Components\Select::make('user_id')
                        ->label('Account')
                        ->required()
                        ->searchable()
                        ->getSearchResultsUsing(fn (string $search) => CvAccessResource::searchStudents($search))
                        ->getOptionLabelUsing(fn ($value) => CvAccessResource::studentLabel($value))
                        ->helperText('Search by name, e-mail or phone.'),
                ])
                ->modalSubmitActionLabel('Open My CV')
                ->action(function (array $data) {
                    $user = User::where('gateway_type', 'student')->find($data['user_id']);
                    if (! $user) {
                        Notification::make()->title('Account not found')->danger()->send();

                        return;
                    }

                    CvAccess::activateFor($user, auth()->user());
                    Notification::make()->title('My CV opened for ' . $user->name)->success()->send();
                }),
            Actions\CreateAction::make()->label('Add candidate'),
        ];
    }
}
