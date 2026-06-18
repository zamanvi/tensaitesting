<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;

class SavedStructureField extends Field
{
    protected string $view = 'filament.forms.components.saved-structure';

    protected function setUp(): void
    {
        parent::setUp();
        $this->dehydrated(false);
        $this->default(null);
    }
}
