<?php

namespace App\Filament\Resources;

use App\Filament\Forms\Components\FormBuilderField;
use App\Filament\Forms\Components\SavedStructureField;
use App\Filament\Resources\FormTemplateResource\Pages;
use App\Models\FormFieldBox;
use App\Models\FormFieldGroup;
use App\Models\FormTemplate;
use App\Models\FormTemplateField;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class FormTemplateResource extends Resource
{
    protected static ?string $model = FormTemplate::class;
    protected static ?string $navigationIcon  = 'heroicon-o-document-plus';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $navigationLabel  = 'Country Forms';
    protected static ?string $modelLabel       = 'Country Form';
    protected static ?string $pluralModelLabel = 'Country Forms';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    // ── Form ─────────────────────────────────────────────────────────────────

    public static function form(Form $form): Form
    {
        return $form->schema([

            // ── Left: Application Form Info ───────────────────────────────────
            Forms\Components\Group::make()->schema([
                Forms\Components\Section::make('Application Form Info')
                    ->icon('heroicon-o-globe-alt')
                    ->extraAttributes(['id' => 'afi-section'])
                    ->columns(2)
                    ->schema([

                        Forms\Components\TextInput::make('country')
                            ->label('Destination Country')
                            ->required()
                            ->unique(
                                table: 'form_templates',
                                column: 'country',
                                modifyRuleUsing: fn (\Illuminate\Validation\Rules\Unique $rule, \Filament\Forms\Get $get, ?FormTemplate $record) =>
                                    $rule
                                        ->where('visa_type', $get('visa_type') ?? '')
                                        ->where('name', $get('name') ?? '')
                                        ->where('status', 'published')
                                        ->ignore($record?->id),
                                ignoreRecord: false,
                            )
                            ->validationMessages(['unique' => 'A published form already exists for this country + visa type + name.'])
                            ->placeholder('e.g. Japan')
                            ->prefixIcon('heroicon-o-flag')
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('visa_type')
                            ->label('Visa Type')
                            ->placeholder('e.g. Student Visa')
                            ->prefixIcon('heroicon-o-identification')
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('name')
                            ->label('Form Name')
                            ->required()
                            ->placeholder('e.g. Japan Study Abroad 2025')
                            ->maxLength(255)
                            ->prefixIcon('heroicon-o-pencil-square')
                            ->columnSpanFull(),

                        Forms\Components\TextInput::make('student_name')
                            ->label('Default Student Name')
                            ->placeholder('e.g. Tanaka Yuki')
                            ->prefixIcon('heroicon-o-user')
                            ->columnSpan(1),

                        Forms\Components\TextInput::make('passport_no')
                            ->label('Passport Number')
                            ->placeholder('e.g. BD1234567')
                            ->prefixIcon('heroicon-o-identification')
                            ->columnSpan(1),

                        Forms\Components\DatePicker::make('birth_date')
                            ->label('Date of Birth')
                            ->prefixIcon('heroicon-o-calendar-days')
                            ->displayFormat('d M Y')
                            ->columnSpan(1),

                        Forms\Components\TagsInput::make('intake_options')
                            ->label('Available Intakes')
                            ->placeholder('Type intake and press Enter…')
                            ->suggestions([
                                'January 2025', 'April 2025', 'July 2025', 'September 2025', 'October 2025',
                                'January 2026', 'April 2026', 'July 2026', 'September 2026', 'October 2026',
                            ])
                            ->columnSpan(1),

                        Forms\Components\Repeater::make('educations')
                            ->label('Required Education Certificates')
                            ->schema([
                                Forms\Components\Grid::make(2)->schema([
                                    Forms\Components\Select::make('level')
                                        ->label('Certificate / Exam')
                                        ->options([
                                            'ssc'       => 'SSC / O-Level',
                                            'hsc'       => 'HSC / A-Level',
                                            'diploma'   => 'Diploma',
                                            'bachelors' => 'Bachelor\'s Degree',
                                            'masters'   => 'Master\'s Degree',
                                            'phd'       => 'PhD / Doctorate',
                                            'other'     => 'Other',
                                        ])
                                        ->required()
                                        ->placeholder('Select level')
                                        ->columnSpan(1),

                                    Forms\Components\Select::make('requirement')
                                        ->label('Requirement')
                                        ->options([
                                            'none'      => 'Not Required',
                                            'optional'  => 'Optional',
                                            'mandatory' => 'Mandatory',
                                        ])
                                        ->default('mandatory')
                                        ->required()
                                        ->columnSpan(1),
                                ]),
                            ])
                            ->addActionLabel('+ Add Certificate')
                            ->itemLabel(fn (array $state): ?string => match($state['level'] ?? '') {
                                'ssc'       => 'SSC / O-Level',
                                'hsc'       => 'HSC / A-Level',
                                'diploma'   => 'Diploma',
                                'bachelors' => 'Bachelor\'s Degree',
                                'masters'   => 'Master\'s Degree',
                                'phd'       => 'PhD / Doctorate',
                                'other'     => 'Other',
                                default     => 'Certificate',
                            })
                            ->collapsible()
                            ->reorderable()
                            ->columnSpanFull(),

                        Forms\Components\Textarea::make('notes')
                            ->rows(2)
                            ->label('Internal Notes')
                            ->placeholder('Private notes for super admins only…')
                            ->columnSpanFull(),

                        Forms\Components\Actions::make([
                            Forms\Components\Actions\Action::make('save_info')
                                ->label('Save Info')
                                ->icon('heroicon-o-check-circle')
                                ->color('success')
                                ->action(fn ($livewire) => $livewire->saveInfoSection()),
                        ])->columnSpanFull(),

                        Forms\Components\Placeholder::make('add_field_hint')
                            ->label('')
                            ->content(new \Illuminate\Support\HtmlString(
                                '<p class="text-xs text-gray-400 text-center py-2">⬇ Scroll down to <strong class="text-gray-500">Add Data &amp; Documents</strong> to add more field sections</p>'
                            ))
                            ->columnSpanFull(),
                    ]),
            ])->columnSpan(['lg' => 2]),

            // ── Right: Saved sections panel ───────────────────────────────────
            Forms\Components\Group::make()->schema([
                Forms\Components\Section::make('Saved Sections')
                    ->icon('heroicon-o-archive-box')
                    ->schema([
                        SavedStructureField::make('saved_structure')
                            ->label('')
                            ->columnSpanFull(),
                    ]),
            ])->columnSpan(['lg' => 1]),

            // ── Full width: Form builder ──────────────────────────────────────
            Forms\Components\Section::make('Add Data & Documents')
                ->icon('heroicon-o-plus-circle')
                ->columnSpanFull()
                ->extraAttributes(['id' => 'add-data-section'])
                ->schema([
                    FormBuilderField::make('form_structure')
                        ->label('')
                        ->columnSpanFull(),
                ]),

        ])->columns(3);
    }

    // ── Education preview (read-only, for super admin) ───────────────────────

    public static function buildEducationPreview(array $educations): array
    {
        if (empty($educations)) return [];

        $levelLabels = [
            'ssc'       => 'SSC / O-Level',
            'hsc'       => 'HSC / A-Level',
            'diploma'   => 'Diploma',
            'bachelors' => "Bachelor's Degree",
            'masters'   => "Master's Degree",
            'phd'       => 'PhD / Doctorate',
            'other'     => 'Other',
        ];

        $fields = [];

        foreach ($educations as $i => $edu) {
            $level       = $edu['level'] ?? 'other';
            $requirement = $edu['requirement'] ?? 'mandatory';
            $label       = $levelLabels[$level] ?? 'Certificate';
            $badge       = match($requirement) {
                'mandatory' => '🔴 Mandatory',
                'optional'  => '📎 Optional',
                default     => '— Not Required',
            };

            $fields[] = Forms\Components\Section::make("{$label}  {$badge}")
                ->schema([
                    Forms\Components\Grid::make(3)->schema([
                        Forms\Components\TextInput::make("_preview_{$i}_institution")
                            ->label('Institution / Board')
                            ->placeholder('e.g. Dhaka Education Board')
                            ->disabled()
                            ->dehydrated(false),

                        Forms\Components\TextInput::make("_preview_{$i}_gpa")
                            ->label('GPA / Grade / Point')
                            ->placeholder('e.g. 5.00 / A+')
                            ->disabled()
                            ->dehydrated(false),

                        Forms\Components\TextInput::make("_preview_{$i}_year")
                            ->label('Passing Year')
                            ->placeholder('e.g. 2022')
                            ->disabled()
                            ->dehydrated(false),
                    ]),

                    Forms\Components\FileUpload::make("_preview_{$i}_document")
                        ->label(
                            $requirement === 'mandatory'
                                ? 'Certificate / Transcript — Required 🔴'
                                : 'Certificate / Transcript — Optional 📎'
                        )
                        ->disabled()
                        ->dehydrated(false)
                        ->columnSpanFull()
                        ->hint($requirement === 'mandatory'
                            ? 'Branch admin must upload before submitting'
                            : 'Branch admin can optionally upload'
                        )
                        ->hintColor($requirement === 'mandatory' ? 'danger' : 'warning'),
                ])
                ->compact()
                ->collapsible()
                ->collapsed(false);
        }

        return $fields;
    }

    // ── Sync JSON structure → relational tables ───────────────────────────────

    public static function syncStructure(FormTemplate $template, array $structure): void
    {
        $keepGroupIds = [];
        $keepBoxIds   = [];
        $keepFieldIds = [];

        // Offset sort_order so new groups don't collide with existing ones
        $sortOffset = ($template->fieldGroups()->max('sort_order') ?? 0) + 1;

        foreach ($structure as $gi => $gData) {
            // Upsert FormFieldGroup (Field Title)
            $defaultLabel = 'Section ' . ($gi + 1);
            $groupAttrs = [
                'form_template_id' => $template->id,
                'label'      => $gData['label'] ?: $defaultLabel,
                'hint'       => $gData['hint'] ?? null,
                'is_active'  => $gData['is_active'] ?? true,
                'sort_order' => $sortOffset + $gi,
            ];
            if (! empty($gData['id']) && $group = FormFieldGroup::find($gData['id'])) {
                $group->update($groupAttrs);
            } else {
                $group = FormFieldGroup::create($groupAttrs);
            }
            $keepGroupIds[] = $group->id;

            // Each box = one "Add Data and Document" section (FormFieldBox)
            foreach ($gData['boxes'] ?? [] as $si => $sData) {
                $boxAttrs = [
                    'form_field_group_id' => $group->id,
                    'name'               => $sData['name'] ?? ('Section ' . ($si + 1)),
                    'is_active'          => $sData['is_active'] ?? true,
                    'requires_document'  => $sData['requires_document'] ?? false,
                    'document_required'  => $sData['document_required'] ?? false,
                    'doc_label'          => $sData['doc_label'] ?? null,
                    'doc_key'            => $sData['doc_key'] ?? null,
                    'sort_order'         => $si,
                ];
                if (! empty($sData['id']) && $box = FormFieldBox::find($sData['id'])) {
                    $box->update($boxAttrs);
                } else {
                    $box = FormFieldBox::create($boxAttrs);
                }
                $keepBoxIds[] = $box->id;

                // Each field = one Q/½/↔ input (FormTemplateField) — skip unlabelled fields
                foreach ($sData['fields'] ?? [] as $fi => $fData) {
                    if (empty(trim($fData['label'] ?? ''))) continue;
                    $fieldAttrs = [
                        'form_template_id'      => $template->id,
                        'form_field_group_id'   => $group->id,
                        'form_field_box_id'     => $box->id,
                        'label'                 => $fData['label'] ?? '',
                        'field_key'             => ($fData['field_key'] ?? '') ?: (\Illuminate\Support\Str::snake($fData['label'] ?? '') ?: 'field') . '_' . uniqid(),
                        'field_type'            => $fData['field_type'] ?? 'text',
                        'box_size'              => $fData['box_size'] ?? 'middle',
                        'is_required'           => $fData['is_required'] ?? false,
                        'is_active'             => $fData['is_active'] ?? true,
                        'requires_document'     => $fData['requires_document'] ?? false,
                        'document_required'     => $fData['document_required'] ?? false,
                        'placeholder'           => $fData['placeholder'] ?: null,
                        'helper_text'           => $fData['helper_text'] ?: null,
                        'options'               => $fData['options'] ?: null,
                        'sort_order'            => $fi,
                        'conditional_field_key' => $fData['conditional_field_key'] ?: null,
                        'conditional_operator'  => $fData['conditional_operator'] ?: null,
                        'conditional_value'     => $fData['conditional_value'] ?: null,
                    ];
                    $fieldId = $fData['field_id'] ?? null;
                    if (! empty($fieldId) && $field = FormTemplateField::find($fieldId)) {
                        $field->update($fieldAttrs);
                    } else {
                        $field = FormTemplateField::create($fieldAttrs);
                    }
                    $keepFieldIds[] = $field->id;
                }
            }
        }

        // NOTE: No auto-delete — sections/fields are deleted manually via Delete buttons.
        // Auto-delete would wipe previously saved sections when the form builder
        // only contains the latest section's JSON.
    }

    // ── Table ─────────────────────────────────────────────────────────────────

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
                    ->label('Form Name')
                    ->searchable()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('intake_options')
                    ->label('Intakes')
                    ->getStateUsing(fn (FormTemplate $record) => $record->intake_options ?? [])
                    ->badge()
                    ->color('success')
                    ->separator(','),

                Tables\Columns\TextColumn::make('field_groups_count_value')
                    ->label('Sections')
                    ->getStateUsing(fn (FormTemplate $record) => $record->fieldGroupsCount()->count())
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
            ->emptyStateHeading('No published forms yet')
            ->emptyStateDescription('Create a new country form, fill in all details, then click "Submit & Publish" to make it live here.')
            ->emptyStateIcon('heroicon-o-document-plus')
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
