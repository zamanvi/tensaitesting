<?php

namespace App\Filament\Pages;

use App\Models\FormTemplate;
use Filament\Pages\Page;

class CreateApplicationsPage extends Page
{
    protected static ?string $navigationIcon  = 'heroicon-o-document-plus';
    protected static ?string $navigationLabel = 'Application Forms';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?int    $navigationSort  = 1;
    protected static bool    $shouldRegisterNavigation = false;
    protected static string  $view            = 'filament.pages.create-applications';

    public function getTitle(): string
    {
        return 'Application Forms';
    }

    public function getViewData(): array
    {
        $templates = FormTemplate::orderBy('country')->get(['id', 'country', 'name', 'visa_type', 'status', 'is_active']);
        return ['templates' => $templates];
    }
}
