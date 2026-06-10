<?php
namespace App\Filament\Resources\BranchTeamMemberResource\Pages;
use App\Filament\Resources\BranchTeamMemberResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
class EditBranchTeamMember extends EditRecord {
    protected static string $resource = BranchTeamMemberResource::class;
    protected function getHeaderActions(): array { return [Actions\DeleteAction::make()]; }
}
