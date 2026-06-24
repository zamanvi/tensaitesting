<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;

class SectionEditorField extends Field
{
    protected string $view = 'filament.forms.components.section-editor';

    protected function setUp(): void
    {
        parent::setUp();
        $this->dehydrated(false);
        $this->default(null);
    }
}
