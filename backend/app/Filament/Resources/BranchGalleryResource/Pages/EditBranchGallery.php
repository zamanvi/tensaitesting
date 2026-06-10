<?php
namespace App\Filament\Resources\BranchGalleryResource\Pages;
use App\Filament\Resources\BranchGalleryResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
class EditBranchGallery extends EditRecord {
    protected static string $resource = BranchGalleryResource::class;
    protected function getHeaderActions(): array { return [Actions\DeleteAction::make()]; }
}
