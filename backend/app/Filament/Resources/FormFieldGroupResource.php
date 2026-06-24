<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FormFieldGroupResource\Pages;
use App\Models\FormFieldBox;
use App\Models\FormFieldGroup;
use App\Models\FormTemplateField;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class FormFieldGroupResource extends Resource
{
    protected static ?string $model = FormFieldGroup::class;

    protected static ?string $navigationIcon = null;

    // Hidden from sidebar
    protected static bool $shouldRegisterNavigation = false;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Section Info')
                ->description('Basic details for this section. The title is shown to branch admins and applicants.')
                ->schema([
                Forms\Components\TextInput::make('label')
                    ->label('Section Title')
                    ->required()
                    ->placeholder('e.g. Family Information, Academic Background')
                    ->helperText('This title appears as the section heading in the application form.')
                    ->hidden(fn ($record) => $record?->label === 'Application Form Info'),

                Forms\Components\Textarea::make('hint')
                    ->label('Section Description')
                    ->rows(2)
                    ->placeholder('Optional — e.g. Please provide details of all immediate family members')
                    ->helperText('Short guidance shown below the section title to help applicants understand what to fill in.'),

                Forms\Components\Toggle::make('is_active')
                    ->label('Visible to applicants')
                    ->helperText('Turn off to hide this section without deleting it.')
                    ->default(true)
                    ->inline(false),
            ])->columns(1),

            Forms\Components\Section::make('Fields')
                ->description('Add the input fields that applicants will fill in for this section.')
                ->schema([
                Forms\Components\Repeater::make('fields_data')
                    ->label('')
                    ->schema([
                        Forms\Components\Hidden::make('id'),

                        Forms\Components\Grid::make(3)->schema([
                            Forms\Components\TextInput::make('label')
                                ->label('Field Label')
                                ->required()
                                ->columnSpan(2),

                            Forms\Components\Select::make('field_type')
                                ->label('Type')
                                ->options([
                                    'text'     => 'Text',
                                    'number'   => 'Number',
                                    'date'     => 'Date',
                                    'select'   => 'Dropdown',
                                    'textarea' => 'Textarea',
                                    'file'     => 'File Upload',
                                ])
                                ->default('text')
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
                        ]),

                        Forms\Components\TextInput::make('options')
                            ->label('Options (comma separated — Dropdown only)')
                            ->placeholder('Male, Female, Other')
                            ->visible(fn (Forms\Get $get) => $get('field_type') === 'select')
                            ->columnSpanFull(),

                        Forms\Components\TextInput::make('helper_text')
                            ->label('Helper Text')
                            ->columnSpanFull(),

                        Forms\Components\Grid::make(3)->schema([
                            Forms\Components\Toggle::make('is_required')
                                ->label('Required')
                                ->inline(false),

                            Forms\Components\Toggle::make('requires_document')
                                ->label('Has Document Upload')
                                ->inline(false)
                                ->live(),

                            Forms\Components\Toggle::make('document_required')
                                ->label('Document Mandatory')
                                ->inline(false)
                                ->visible(fn (Forms\Get $get) => $get('requires_document')),
                        ]),
                    ])
                    ->itemLabel(fn (array $state): ?string => $state['label'] ?: 'New Field')
                    ->collapsible()
                    ->reorderable()
                    ->addActionLabel('+ Add Field')
                    ->defaultItems(0),
            ]),
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
            'index' => Pages\ListFormFieldGroups::route('/'),
            'edit'  => Pages\EditFormFieldGroup::route('/{record}/edit'),
        ];
    }
}
