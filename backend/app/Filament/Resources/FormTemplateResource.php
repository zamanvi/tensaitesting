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
    protected static ?string $navigationLabel = 'Application Form Builder';
    protected static ?int    $navigationSort  = 3;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([

            // ── Left column: Template Info ────────────────────────────────────
            Forms\Components\Group::make()->schema([

                Forms\Components\Section::make('Template Info')
                    ->icon('heroicon-o-globe-alt')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('country')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->placeholder('e.g. Japan')
                            ->helperText('Must match the country name used in the application form.')
                            ->prefixIcon('heroicon-o-flag'),

                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->placeholder('e.g. Japan Study Abroad Application')
                            ->maxLength(255)
                            ->prefixIcon('heroicon-o-pencil-square'),

                        Forms\Components\TagsInput::make('intake_options')
                            ->label('Available Intakes')
                            ->placeholder('Type and press Enter — e.g. April 2025')
                            ->helperText('Branch admin picks from these in the application form.')
                            ->columnSpanFull(),

                        Forms\Components\Textarea::make('notes')
                            ->rows(2)
                            ->placeholder('Internal notes about this template…')
                            ->columnSpanFull(),
                    ]),

            ])->columnSpan(['lg' => 2]),

            // ── Right column: Status ──────────────────────────────────────────
            Forms\Components\Group::make()->schema([

                Forms\Components\Section::make('Status')
                    ->icon('heroicon-o-check-circle')
                    ->schema([
                        Forms\Components\Toggle::make('is_active')
                            ->label('Template Active')
                            ->helperText('Inactive templates are hidden from branch admins.')
                            ->default(true),
                    ]),

                Forms\Components\Section::make('Quick Guide')
                    ->icon('heroicon-o-light-bulb')
                    ->collapsible()
                    ->collapsed(true)
                    ->schema([
                        Forms\Components\Placeholder::make('')
                            ->content(
                                '• Add groups as form sections (e.g. Academic Background)' . "\n" .
                                '• Add field boxes inside each group' . "\n" .
                                '• Use custom_ prefix for new field keys' . "\n" .
                                '• Toggle 📎 to require a document upload per field' . "\n" .
                                '• Use Conditional Visibility to show/hide fields'
                            ),
                    ]),

            ])->columnSpan(['lg' => 1]),

            // ── Full width: Field Groups ──────────────────────────────────────
            Forms\Components\Section::make('Form Sections')
                ->icon('heroicon-o-rectangle-stack')
                ->description('Each section contains fields shown in the branch application form. Add a new section at the bottom, then add fields inside it.')
                ->columnSpanFull()
                ->schema([
                    Forms\Components\Repeater::make('fieldGroups')
                        ->relationship('fieldGroups')
                        ->orderColumn('sort_order')
                        ->collapsible()
                        ->cloneable()
                        ->addActionLabel('＋ Add New Section')
                        ->itemLabel(fn (array $state): string =>
                            '📂  ' . ($state['label'] ?? 'Untitled Section') .
                            (isset($state['fields']) ? '  — ' . count($state['fields']) . ' fields' : '')
                        )
                        ->schema([

                            Forms\Components\Grid::make(3)->schema([
                                Forms\Components\TextInput::make('label')
                                    ->required()
                                    ->label('Group Title')
                                    ->placeholder('e.g. Academic Background')
                                    ->prefixIcon('heroicon-o-bars-3')
                                    ->columnSpan(1),

                                Forms\Components\TextInput::make('hint')
                                    ->label('Group Subtitle')
                                    ->placeholder('e.g. Enter your academic qualifications')
                                    ->helperText('Shown under the group title in the form')
                                    ->columnSpan(1),

                                Forms\Components\Toggle::make('is_active')
                                    ->label('Group Visible')
                                    ->default(true)
                                    ->inline(false)
                                    ->columnSpan(1),
                            ]),

                            // ── Field boxes inside this group ─────────────────
                            Forms\Components\Repeater::make('fields')
                                ->relationship('fields')
                                ->orderColumn('sort_order')
                                ->collapsible()
                                ->cloneable()
                                ->addActionLabel('＋ Add Field to this Section')
                                ->itemLabel(fn (array $state): string =>
                                    (!empty($state['label'])
                                        ? '▸  ' . $state['label'] . '  [' . strtoupper($state['box_size'] ?? 'middle') . ']'
                                        : '▸  New Field — enter label below') .
                                    (!empty($state['is_required']) ? '  *required' : '') .
                                    (!empty($state['requires_document']) ? '  📎' : '')
                                )
                                ->schema([

                                    // Row 1: label + key + size
                                    Forms\Components\Grid::make(4)->schema([
                                        Forms\Components\TextInput::make('label')
                                            ->required()
                                            ->label('Field Label')
                                            ->placeholder('e.g. JLPT Score')
                                            ->columnSpan(2),

                                        Forms\Components\TextInput::make('field_key')
                                            ->required()
                                            ->label('Field Key')
                                            ->placeholder('e.g. jlpt_score')
                                            ->helperText('snake_case. Prefix new fields with custom_')
                                            ->columnSpan(1),

                                        Forms\Components\Select::make('box_size')
                                            ->label('Width')
                                            ->required()
                                            ->default('middle')
                                            ->options([
                                                'small'  => '⅓ Small',
                                                'middle' => '½ Middle',
                                                'full'   => '↔ Full',
                                            ])
                                            ->columnSpan(1),
                                    ]),

                                    // Row 2: type + placeholder + hint
                                    Forms\Components\Grid::make(3)->schema([
                                        Forms\Components\Select::make('field_type')
                                            ->required()
                                            ->label('Field Type')
                                            ->options([
                                                'text'     => '✏️  Text',
                                                'number'   => '🔢  Number',
                                                'date'     => '📅  Date',
                                                'select'   => '▾  Dropdown',
                                                'textarea' => '📝  Textarea',
                                                'file'     => '📎  File Only',
                                            ])
                                            ->live(),

                                        Forms\Components\TextInput::make('placeholder')
                                            ->label('Placeholder')
                                            ->placeholder('e.g. Enter your score…'),

                                        Forms\Components\TextInput::make('helper_text')
                                            ->label('Hint / Helper')
                                            ->placeholder('e.g. Out of 5.00'),
                                    ]),

                                    // Row 3: select options (only for dropdown)
                                    Forms\Components\TagsInput::make('options')
                                        ->label('Dropdown Options')
                                        ->placeholder('Type each option and press Enter')
                                        ->helperText('e.g.  N1  N2  N3  N4  N5  None')
                                        ->visible(fn (Forms\Get $get) => $get('field_type') === 'select'),

                                    // Row 4: toggles
                                    Forms\Components\Grid::make(3)->schema([
                                        Forms\Components\Toggle::make('is_required')
                                            ->label('Required *')
                                            ->default(false)
                                            ->inline(false),

                                        Forms\Components\Toggle::make('requires_document')
                                            ->label('📎 Needs Document')
                                            ->helperText('Shows upload button in branch form')
                                            ->default(false)
                                            ->inline(false),

                                        Forms\Components\Toggle::make('is_active')
                                            ->label('Field Visible')
                                            ->default(true)
                                            ->inline(false),
                                    ]),

                                    // Row 5: conditional (collapsed)
                                    Forms\Components\Section::make('⚙️  Conditional Visibility')
                                        ->description('Show this field only when another field has a specific value')
                                        ->collapsible()
                                        ->collapsed(true)
                                        ->schema([
                                            Forms\Components\Grid::make(3)->schema([
                                                Forms\Components\TextInput::make('conditional_field_key')
                                                    ->label('When field key…')
                                                    ->placeholder('e.g. jlpt_level'),

                                                Forms\Components\Select::make('conditional_operator')
                                                    ->label('…operator…')
                                                    ->placeholder('Select')
                                                    ->options([
                                                        'is'           => 'is',
                                                        'is_not'       => 'is not',
                                                        'is_empty'     => 'is empty',
                                                        'is_not_empty' => 'is not empty',
                                                    ]),

                                                Forms\Components\TextInput::make('conditional_value')
                                                    ->label('…value')
                                                    ->placeholder('e.g. None'),
                                            ]),
                                        ]),
                                ])
                                ->columns(1)
                                ->grid(1),
                        ]),
                ]),

        ])->columns(3);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('country')
                    ->searchable()->sortable()
                    ->weight('bold')
                    ->icon('heroicon-o-flag'),

                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('fieldGroups_count')
                    ->label('Groups')
                    ->counts('fieldGroups')
                    ->badge()
                    ->color('info'),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Last Updated')
                    ->since()
                    ->sortable()
                    ->color('gray'),
            ])
            ->defaultSort('country')
            ->striped()
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

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListFormTemplates::route('/'),
            'create' => Pages\CreateFormTemplate::route('/create'),
            'edit'   => Pages\EditFormTemplate::route('/{record}/edit'),
        ];
    }
}
