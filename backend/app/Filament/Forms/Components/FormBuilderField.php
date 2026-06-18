<?php

namespace App\Filament\Forms\Components;

use Filament\Forms\Components\Field;

class FormBuilderField extends Field
{
    protected string $view = 'filament.forms.components.form-builder';

    protected function setUp(): void
    {
        parent::setUp();

        $this->default('[]');

        $this->dehydrated(false);

        $this->afterStateHydrated(function (FormBuilderField $component) {
            $component->state('[]');
        });
    }
}
