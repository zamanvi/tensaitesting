<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FormTemplateFieldResource\Pages;
use App\Models\FormTemplateField;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class FormTemplateFieldResource extends Resource
{
    protected static ?string $model = FormTemplateField::class;

    protected static ?string $navigationIcon = null;

    // Hidden from sidebar — accessed only via edit links
    protected static bool $shouldRegisterNavigation = false;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Field Info')->schema([
                Forms\Components\TextInput::make('label')
                    ->label('Field Label')
                    ->required()
                    ->columnSpan(2),

                Forms\Components\Select::make('field_type')
                    ->label('Field Type')
                    ->options([
                        'text'     => 'Text',
                        'number'   => 'Number',
                        'date'     => 'Date',
                        'select'   => 'Dropdown',
                        'textarea' => 'Textarea',
                        'file'     => 'File Upload',
                    ])
                    ->required()
                    ->live()
                    ->columnSpan(1),

                Forms\Components\Select::make('box_size')
                    ->label('Width')
                    ->options([
                        'small'  => 'Small (25%)',
                        'middle' => 'Half (50%)',
                        'full'   => 'Full (100%)',
                    ])
                    ->default('middle')
                    ->columnSpan(1),

                Forms\Components\TextInput::make('placeholder')
                    ->label('Placeholder')
                    ->columnSpan(2),

                Forms\Components\TextInput::make('helper_text')
                    ->label('Helper Text')
                    ->columnSpan('full'),

                Forms\Components\TextInput::make('options')
                    ->label('Options (comma separated)')
                    ->placeholder('e.g. Male, Female, Other')
                    ->visible(fn (Forms\Get $get) => $get('field_type') === 'select')
                    ->columnSpan('full')
                    ->dehydrateStateUsing(fn ($state) => $state
                        ? array_map('trim', explode(',', $state))
                        : null)
                    ->formatStateUsing(fn ($state) => is_array($state) ? implode(', ', $state) : $state),

            ])->columns(3),

            Forms\Components\Section::make('Settings')->schema([
                Forms\Components\Toggle::make('is_required')
                    ->label('Required field')
                    ->inline(false),

                Forms\Components\Toggle::make('is_active')
                    ->label('Active')
                    ->inline(false),

                Forms\Components\Toggle::make('requires_document')
                    ->label('Has Document Upload')
                    ->inline(false)
                    ->live(),

                Forms\Components\Toggle::make('document_required')
                    ->label('Document Mandatory')
                    ->inline(false)
                    ->visible(fn (Forms\Get $get) => $get('requires_document')),
            ])->columns(4),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('label'),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'edit' => Pages\EditFormTemplateField::route('/{record}/edit'),
        ];
    }
}
