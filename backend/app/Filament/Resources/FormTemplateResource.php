<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FormTemplateResource\Pages;
use App\Models\FormTemplate;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class FormTemplateResource extends Resource
{
    protected static ?string $model = FormTemplate::class;
    protected static ?string $navigationIcon  = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $navigationLabel = 'Create Applications';
    protected static ?int    $navigationSort  = 3;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([

            // ── Left: Template Info ───────────────────────────────────────────
            Forms\Components\Group::make()->schema([

                Forms\Components\Section::make('Application Form Info')
                    ->icon('heroicon-o-globe-alt')
                    ->columns(2)
                    ->schema([
                        Forms\Components\TextInput::make('country')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->label('Country')
                            ->placeholder('e.g. Japan')
                            ->helperText('One form per country. Must match country name used in applications.')
                            ->prefixIcon('heroicon-o-flag')
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('visa_type')
                            ->label('Visa Type')
                            ->placeholder('e.g. Student Visa, Work Permit')
                            ->prefixIcon('heroicon-o-identification')
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->label('Form Name')
                            ->placeholder('e.g. Japan Study Abroad Application')
                            ->maxLength(255)
                            ->prefixIcon('heroicon-o-pencil-square')
                            ->columnSpanFull(),

                        Forms\Components\TagsInput::make('intake_options')
                            ->label('Available Intakes')
                            ->placeholder('Type and press Enter — e.g. April 2025')
                            ->helperText('Branch admin picks from these when filling an application.')
                            ->columnSpanFull(),

                        Forms\Components\Textarea::make('notes')
                            ->rows(2)
                            ->label('Internal Notes')
                            ->placeholder('Notes visible only to admins…')
                            ->columnSpanFull(),
                    ]),

            ])->columnSpan(['lg' => 2]),

            // ── Right: Status ─────────────────────────────────────────────────
            Forms\Components\Group::make()->schema([

                Forms\Components\Section::make('Status')
                    ->icon('heroicon-o-check-circle')
                    ->schema([
                        Forms\Components\Select::make('status')
                            ->label('Form Status')
                            ->options([
                                'draft'     => '📝  Draft — not visible to branches',
                                'published' => '✅  Published — live to branches',
                            ])
                            ->default('draft')
                            ->required()
                            ->helperText('Only published forms are available to branch admins.'),

                        Forms\Components\Toggle::make('is_active')
                            ->label('Form Active')
                            ->helperText('Unpublish temporarily without deleting.')
                            ->default(true),
                    ]),

                Forms\Components\Section::make('Quick Guide')
                    ->icon('heroicon-o-light-bulb')
                    ->collapsible()
                    ->collapsed(true)
                    ->schema([
                        Forms\Components\Placeholder::make('')
                            ->content(
                                "1. Fill Country, Visa Type, Form Name\n" .
                                "2. Add Fields (top-level sections e.g. Academic Background)\n" .
                                "3. Inside each Field, create Boxes (e.g. HSC Result)\n" .
                                "4. Inside each Box, add sub-inputs (¼ Quarter / ½ Half / ↔ Full)\n" .
                                "5. Toggle 📎 on a Box if a document upload is required\n" .
                                "6. Save as Draft while building — Publish when ready"
                            ),
                    ]),

            ])->columnSpan(['lg' => 1]),

            // ── Full width: Field Builder ──────────────────────────────────────
            Forms\Components\Section::make('Form Fields')
                ->icon('heroicon-o-rectangle-stack')
                ->description('Build your form. Each Field is a section (e.g. Academic Background). Inside each Field, add Boxes (e.g. HSC Result). Each Box holds sub-inputs.')
                ->columnSpanFull()
                ->schema([
                    Forms\Components\Repeater::make('fieldGroups')
                        ->relationship('fieldGroups')
                        ->orderColumn('sort_order')
                        ->collapsible()
                        ->cloneable()
                        ->addActionLabel('＋ Add New Field')
                        ->itemLabel(fn (array $state): string =>
                            '📂  ' . ($state['label'] ?? 'Untitled Field') .
                            (isset($state['boxes']) ? '  — ' . count($state['boxes']) . ' boxes' : '')
                        )
                        ->schema([

                            Forms\Components\Grid::make(2)->schema([
                                Forms\Components\TextInput::make('label')
                                    ->required()
                                    ->label('Field Title')
                                    ->placeholder('e.g. Academic Background')
                                    ->prefixIcon('heroicon-o-bars-3')
                                    ->columnSpan(1),

                                Forms\Components\Toggle::make('is_active')
                                    ->label('Field Visible')
                                    ->default(true)
                                    ->inline(false)
                                    ->columnSpan(1),
                            ]),

                            // ── Boxes ─────────────────────────────────────────
                            Forms\Components\Repeater::make('boxes')
                                ->relationship('boxes')
                                ->orderColumn('sort_order')
                                ->collapsible()
                                ->cloneable()
                                ->addActionLabel('＋ Create Box')
                                ->itemLabel(fn (array $state): string =>
                                    '📦  ' . ($state['name'] ?? 'Untitled Box') .
                                    (!empty($state['requires_document']) ? '  📎' : '') .
                                    (isset($state['fields']) ? '  — ' . count($state['fields']) . ' inputs' : '')
                                )
                                ->schema([

                                    Forms\Components\Grid::make(3)->schema([
                                        Forms\Components\TextInput::make('name')
                                            ->required()
                                            ->label('Box Name')
                                            ->placeholder('e.g. HSC Result')
                                            ->prefixIcon('heroicon-o-inbox')
                                            ->columnSpan(1),

                                        Forms\Components\Toggle::make('requires_document')
                                            ->label('📎 Requires Document')
                                            ->helperText('Student must upload a file for this box')
                                            ->default(false)
                                            ->inline(false)
                                            ->columnSpan(1),

                                        Forms\Components\Toggle::make('is_active')
                                            ->label('Box Visible')
                                            ->default(true)
                                            ->inline(false)
                                            ->columnSpan(1),
                                    ]),

                                    // ── Sub-inputs ────────────────────────────
                                    Forms\Components\Repeater::make('fields')
                                        ->relationship('fields')
                                        ->orderColumn('sort_order')
                                        ->collapsible()
                                        ->cloneable()
                                        ->addActionLabel('＋ Add Sub-input')
                                        ->itemLabel(fn (array $state): string =>
                                            (!empty($state['label'])
                                                ? '▸  ' . $state['label'] . '  [' . strtoupper($state['box_size'] ?? 'middle') . ']'
                                                : '▸  New sub-input') .
                                            (!empty($state['is_required']) ? '  *' : '')
                                        )
                                        ->schema([

                                            Forms\Components\Grid::make(4)->schema([
                                                Forms\Components\TextInput::make('label')
                                                    ->required()
                                                    ->label('Hint Text')
                                                    ->placeholder('e.g. Enter GPA out of 5.00')
                                                    ->helperText('Shown to student as placeholder / label')
                                                    ->columnSpan(2),

                                                Forms\Components\TextInput::make('field_key')
                                                    ->required()
                                                    ->label('Field Key')
                                                    ->placeholder('e.g. hsc_gpa')
                                                    ->helperText('snake_case — prefix new fields with custom_')
                                                    ->columnSpan(1),

                                                Forms\Components\Select::make('box_size')
                                                    ->label('Width')
                                                    ->required()
                                                    ->default('middle')
                                                    ->options([
                                                        'small'  => '¼ Quarter',
                                                        'middle' => '½ Half',
                                                        'full'   => '↔ Full',
                                                    ])
                                                    ->columnSpan(1),
                                            ]),

                                            Forms\Components\Grid::make(3)->schema([
                                                Forms\Components\Select::make('field_type')
                                                    ->required()
                                                    ->label('Field Type')
                                                    ->default('text')
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

                                            Forms\Components\TagsInput::make('options')
                                                ->label('Dropdown Options')
                                                ->placeholder('Type each option and press Enter')
                                                ->helperText('e.g.  N1  N2  N3  N4  N5  None')
                                                ->visible(fn (Forms\Get $get) => $get('field_type') === 'select'),

                                            Forms\Components\Grid::make(2)->schema([
                                                Forms\Components\Toggle::make('is_required')
                                                    ->label('Required *')
                                                    ->default(false)
                                                    ->inline(false),

                                                Forms\Components\Toggle::make('is_active')
                                                    ->label('Sub-input Visible')
                                                    ->default(true)
                                                    ->inline(false),
                                            ]),

                                            Forms\Components\Section::make('⚙️  Conditional Visibility')
                                                ->description('Show this sub-input only when another field has a specific value')
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

                Tables\Columns\TextColumn::make('visa_type')
                    ->label('Visa Type')
                    ->default('—')
                    ->color('gray'),

                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->color('gray')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('fieldGroups_count')
                    ->label('Fields')
                    ->counts('fieldGroups')
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'published' => 'success',
                        'draft'     => 'warning',
                        default     => 'gray',
                    }),

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
                Tables\Actions\Action::make('publish')
                    ->label('Publish')
                    ->icon('heroicon-o-rocket-launch')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Publish this form?')
                    ->modalDescription('Once published, branch admins and agencies can use this form to fill applications.')
                    ->visible(fn (FormTemplate $r) => $r->status === 'draft')
                    ->action(function (FormTemplate $r) {
                        $r->update(['status' => 'published', 'is_active' => true]);
                        Notification::make()
                            ->title('Form published — now live to branches')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('unpublish')
                    ->label('Unpublish')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Unpublish this form?')
                    ->modalDescription('Branches will no longer be able to use this form. Existing submitted applications are not affected.')
                    ->visible(fn (FormTemplate $r) => $r->status === 'published')
                    ->action(function (FormTemplate $r) {
                        $r->update(['status' => 'draft']);
                        Notification::make()
                            ->title('Form unpublished — moved back to draft')
                            ->warning()
                            ->send();
                    }),

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
