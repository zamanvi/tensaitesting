<?php

namespace App\Filament\Pages;

use App\Models\FormTemplate;
use Filament\Pages\Page;

class CreateApplicationsPage extends Page
{
    protected static ?string $navigationIcon  = 'heroicon-o-document-plus';
    protected static ?string $navigationLabel = 'Create Applications';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?int    $navigationSort  = 1;
    protected static string  $view            = 'filament.pages.create-applications';

    public function getTitle(): string
    {
        return 'Create Applications';
    }

    public function getViewData(): array
    {
        $templates = FormTemplate::orderBy('country')->get(['id', 'country', 'name', 'status', 'is_active']);
        return ['templates' => $templates];
    }
}
