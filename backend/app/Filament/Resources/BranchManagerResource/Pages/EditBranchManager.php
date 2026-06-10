<?php
namespace App\Filament\Resources\BranchManagerResource\Pages;
use App\Filament\Resources\BranchManagerResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
class EditBranchManager extends EditRecord {
    protected static string $resource = BranchManagerResource::class;
    protected function getHeaderActions(): array { return [Actions\DeleteAction::make()]; }
}
