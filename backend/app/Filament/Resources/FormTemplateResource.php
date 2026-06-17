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

            // ── Template Info ─────────────────────────────────────────────────
            Forms\Components\Section::make('Template Info')
                ->columns(2)
                ->schema([
                    Forms\Components\TextInput::make('country')
                        ->required()
                        ->unique(ignoreRecord: true)
                        ->placeholder('e.g. Japan')
                        ->helperText('Must match the country name in the application form dropdown exactly.'),

                    Forms\Components\TextInput::make('name')
                        ->required()
                        ->placeholder('e.g. Japan Study Abroad Application')
                        ->maxLength(255),

                    Forms\Components\TagsInput::make('intake_options')
                        ->label('Intake Options')
                        ->placeholder('Type and press Enter — e.g. April 2025')
                        ->helperText('Branch admin will select from these as a dropdown.')
                        ->columnSpanFull(),

                    Forms\Components\Toggle::make('is_active')
                        ->label('Active')
                        ->default(true),

                    Forms\Components\Textarea::make('notes')
                        ->rows(2)
                        ->placeholder('Internal notes…')
                        ->columnSpanFull(),
                ]),

            // ── Field Groups (nested repeater) ────────────────────────────────
            Forms\Components\Section::make('Form Field Groups')
                ->description('Organize fields into groups. Each group appears as a section in the application form. Drag groups to reorder.')
                ->schema([
                    Forms\Components\Repeater::make('fieldGroups')
                        ->relationship('fieldGroups')
                        ->orderColumn('sort_order')
                        ->collapsible()
                        ->cloneable()
                        ->addActionLabel('+ Add Group')
                        ->itemLabel(fn (array $state): string => $state['label'] ?? 'New Group')
                        ->schema([

                            // Group header
                            Forms\Components\Grid::make(2)->schema([
                                Forms\Components\TextInput::make('label')
                                    ->required()
                                    ->placeholder('e.g. HSC Information')
                                    ->label('Group Title'),

                                Forms\Components\TextInput::make('hint')
                                    ->placeholder('e.g. Provide your HSC/equivalent details')
                                    ->label('Group Hint')
                                    ->helperText('Shown as subtitle under group title'),
                            ]),

                            Forms\Components\Toggle::make('is_active')
                                ->label('Group Visible')
                                ->default(true),

                            // ── Boxes inside the group ──────────────────────
                            Forms\Components\Repeater::make('fields')
                                ->relationship('fields')
                                ->orderColumn('sort_order')
                                ->collapsible()
                                ->cloneable()
                                ->addActionLabel('+ Add Field Box')
                                ->itemLabel(fn (array $state): string =>
                                    ($state['label'] ?? 'New Box') . ' [' . ($state['box_size'] ?? 'middle') . ']'
                                )
                                ->schema([

                                    Forms\Components\Grid::make(3)->schema([
                                        Forms\Components\TextInput::make('label')
                                            ->required()
                                            ->placeholder('e.g. HSC Score')
                                            ->label('Field Label')
                                            ->columnSpan(2),

                                        Forms\Components\Select::make('box_size')
                                            ->label('Box Size')
                                            ->required()
                                            ->default('middle')
                                            ->options([
                                                'small'  => 'Small (1/3 width)',
                                                'middle' => 'Middle (1/2 width)',
                                                'full'   => 'Full (full width)',
                                            ])
                                            ->columnSpan(1),
                                    ]),

                                    Forms\Components\Grid::make(2)->schema([
                                        Forms\Components\Select::make('field_type')
                                            ->required()
                                            ->label('Field Type')
                                            ->options([
                                                'text'     => 'Text Input',
                                                'number'   => 'Number Input',
                                                'date'     => 'Date Picker',
                                                'select'   => 'Dropdown Select',
                                                'textarea' => 'Textarea (Long)',
                                                'file'     => 'File Upload Only',
                                            ])
                                            ->live(),

                                        Forms\Components\TextInput::make('field_key')
                                            ->required()
                                            ->label('Field Key')
                                            ->placeholder('e.g. hsc_score or custom_coe_number')
                                            ->helperText('snake_case. Use custom_ prefix for new fields.'),
                                    ]),

                                    Forms\Components\TagsInput::make('options')
                                        ->label('Select Options')
                                        ->placeholder('Type each option and press Enter')
                                        ->helperText('Only for Dropdown type. e.g. N1, N2, N3')
                                        ->visible(fn (Forms\Get $get) => $get('field_type') === 'select'),

                                    Forms\Components\Grid::make(2)->schema([
                                        Forms\Components\TextInput::make('placeholder')
                                            ->placeholder('e.g. Enter your GPA…')
                                            ->label('Placeholder'),

                                        Forms\Components\TextInput::make('helper_text')
                                            ->placeholder('e.g. Out of 5.00')
                                            ->label('Hint Text'),
                                    ]),

                                    Forms\Components\Grid::make(3)->schema([
                                        Forms\Components\Toggle::make('is_required')
                                            ->label('Required')
                                            ->default(false),

                                        Forms\Components\Toggle::make('requires_document')
                                            ->label('📎 Needs Document Upload')
                                            ->helperText('Upload button appears next to this field.')
                                            ->default(false),

                                        Forms\Components\Toggle::make('is_active')
                                            ->label('Visible')
                                            ->default(true),
                                    ]),

                                    // ── Conditional visibility ────────────────
                                    Forms\Components\Section::make('Conditional Visibility (optional)')
                                        ->schema([
                                            Forms\Components\Grid::make(3)->schema([
                                                Forms\Components\TextInput::make('conditional_field_key')
                                                    ->label('Show only when field key')
                                                    ->placeholder('e.g. jlpt_level'),

                                                Forms\Components\Select::make('conditional_operator')
                                                    ->label('Operator')
                                                    ->options([
                                                        'is'           => 'is',
                                                        'is_not'       => 'is not',
                                                        'is_empty'     => 'is empty',
                                                        'is_not_empty' => 'is not empty',
                                                    ]),

                                                Forms\Components\TextInput::make('conditional_value')
                                                    ->label('Value')
                                                    ->placeholder('e.g. None'),
                                            ]),
                                        ])
                                        ->collapsible()
                                        ->collapsed(true),
                                ]),
                        ]),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('country')
                    ->searchable()->sortable()->weight('bold'),

                Tables\Columns\TextColumn::make('name')
                    ->searchable(),

                Tables\Columns\TextColumn::make('fieldGroups_count')
                    ->label('Groups')
                    ->counts('fieldGroups')
                    ->badge()->color('info'),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')->boolean(),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Last Updated')->since()->sortable(),
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

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListFormTemplates::route('/'),
            'create' => Pages\CreateFormTemplate::route('/create'),
            'edit'   => Pages\EditFormTemplate::route('/{record}/edit'),
        ];
    }
}
