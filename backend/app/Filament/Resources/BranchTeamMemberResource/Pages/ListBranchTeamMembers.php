<?php
namespace App\Filament\Resources\BranchTeamMemberResource\Pages;
use App\Filament\Resources\BranchTeamMemberResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
class ListBranchTeamMembers extends ListRecords {
    protected static string $resource = BranchTeamMemberResource::class;
    protected function getHeaderActions(): array { return [Actions\CreateAction::make()]; }
}
