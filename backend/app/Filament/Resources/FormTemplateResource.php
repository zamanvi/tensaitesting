<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FormTemplateResource\Pages;
use App\Models\FormTemplate;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class FormTemplateResource extends Resource
{
    protected static ?string $model = FormTemplate::class;
    protected static ?string $navigationIcon  = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $navigationLabel = 'Application Form Templates';
    protected static ?int    $navigationSort  = 3;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([

            Forms\Components\Section::make('Template Info')
                ->columns(2)
                ->schema([
                    Forms\Components\TextInput::make('country')
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->placeholder('e.g. Japan')
                        ->helperText('Exact country name as shown in the application form country dropdown.'),

                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->placeholder('e.g. Japan Application Form')
                        ->maxLength(255),

                    Forms\Components\TagsInput::make('intake_options')
                        ->label('Intake Options')
                        ->placeholder('Type and press Enter — e.g. April 2025')
                        ->helperText('Branch admin will see these as a dropdown for intake selection.')
                        ->columnSpanFull(),

                    Forms\Components\Toggle::make('is_active')
                        ->label('Active')
                        ->default(true)
                        ->helperText('Inactive templates will not show in the application form.'),

                    Forms\Components\Textarea::make('notes')
                        ->rows(2)
                        ->placeholder('Internal notes for this template…')
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Form Fields')
                ->description('Define which fields appear in the application form for this country. Drag to reorder.')
                ->schema([
                    Forms\Components\Repeater::make('fields')
                        ->relationship()
                        ->orderColumn('sort_order')
                        ->collapsible()
                        ->cloneable()
                        ->addActionLabel('+ Add Field')
                        ->itemLabel(fn (array $state): string =>
                            ($state['label'] ?? 'New Field') . ' (' . ($state['section'] ?? '—') . ')'
                        )
                        ->columns(2)
                        ->schema([
                            Forms\Components\TextInput::make('label')
                                ->required()
                                ->placeholder('e.g. JLPT Level')
                                ->columnSpanFull(),

                            Forms\Components\Select::make('section')
                                ->required()
                                ->options([
                                    'personal'  => '① Personal Information',
                                    'academic'  => '② Academic Background',
                                    'language'  => '③ Language Proficiency',
                                    'study'     => '④ Study Goals & Intake',
                                    'sponsor'   => '⑤ Sponsor & Financial',
                                    'documents' => '⑥ Documents Upload',
                                ]),

                            Forms\Components\Select::make('field_type')
                                ->required()
                                ->options([
                                    'text'     => 'Text Input',
                                    'number'   => 'Number Input',
                                    'date'     => 'Date Picker',
                                    'select'   => 'Dropdown Select',
                                    'textarea' => 'Textarea',
                                    'file'     => 'File Upload',
                                ])
                                ->live(),

                            Forms\Components\TextInput::make('field_key')
                                ->required()
                                ->placeholder('e.g. jlpt_level or custom_coe_number')
                                ->helperText('snake_case. Use "custom_" prefix for new fields. Standard keys: jlpt_level, english_score, passport_number, sponsor_name, etc.')
                                ->columnSpanFull(),

                            Forms\Components\TagsInput::make('options')
                                ->label('Options (for Dropdown)')
                                ->placeholder('Type and press Enter')
                                ->helperText('Only for Select type. e.g. N1, N2, N3, N4, N5')
                                ->visible(fn (Forms\Get $get) => $get('field_type') === 'select')
                                ->columnSpanFull(),

                            Forms\Components\TextInput::make('placeholder')
                                ->placeholder('e.g. Select your JLPT level…'),

                            Forms\Components\TextInput::make('helper_text')
                                ->label('Helper Text')
                                ->placeholder('e.g. Leave blank if not applicable'),

                            Forms\Components\Toggle::make('is_required')
                                ->label('Required field')
                                ->default(false),

                            Forms\Components\Toggle::make('requires_document')
                                ->label('📎 Needs document upload')
                                ->helperText('A file upload button will appear next to this field in the application form.')
                                ->default(false),

                            Forms\Components\Toggle::make('is_active')
                                ->label('Visible')
                                ->default(true),
                        ]),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('country')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('name')
                    ->searchable(),

                Tables\Columns\TextColumn::make('fields_count')
                    ->label('Fields')
                    ->counts('fields')
                    ->badge()
                    ->color('info'),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('country')
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelationManagers(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListFormTemplates::route('/'),
            'create' => Pages\CreateFormTemplate::route('/create'),
            'edit'   => Pages\EditFormTemplate::route('/{record}/edit'),
        ];
    }
}
