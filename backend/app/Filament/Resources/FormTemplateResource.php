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
    protected static ?string $navigationIcon  = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $navigationLabel = 'Create Applications';
    protected static ?int    $navigationSort  = 3;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    // ── Form ─────────────────────────────────────────────────────────────────

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

            // ── Right: Saved field groups ─────────────────────────────────────
            Forms\Components\Group::make()->schema([
                Forms\Components\Section::make('For Save Data')
                    ->icon('heroicon-o-archive-box')
                    ->schema([
                        SavedStructureField::make('saved_structure')
                            ->label('')
                            ->columnSpanFull(),
                    ]),
            ])->columnSpan(['lg' => 1]),

            // ── Full width: Custom Form Builder ───────────────────────────────
            Forms\Components\Section::make('Add Data and Document')
                ->icon('heroicon-o-rectangle-stack')
                ->columnSpanFull()
                ->schema([
                    FormBuilderField::make('form_structure')
                        ->label('')
                        ->columnSpanFull(),
                ]),

        ])->columns(3);
    }

    // ── Sync JSON structure → relational tables ───────────────────────────────

    public static function syncStructure(FormTemplate $template, array $structure): void
    {
        $keepGroupIds = [];
        $keepBoxIds   = [];
        $keepFieldIds = [];

        foreach ($structure as $gi => $gData) {
            // Upsert group
            $groupAttrs = [
                'form_template_id' => $template->id,
                'label'      => $gData['label'] ?? '',
                'is_active'  => $gData['is_active'] ?? true,
                'sort_order' => $gi,
            ];
            if (! empty($gData['id']) && $group = FormFieldGroup::find($gData['id'])) {
                $group->update($groupAttrs);
            } else {
                $group = FormFieldGroup::create($groupAttrs);
            }
            $keepGroupIds[] = $group->id;

            // Each group gets one default container box
            $box = $group->boxes()->first();
            if (! $box) {
                $box = FormFieldBox::create([
                    'form_field_group_id' => $group->id,
                    'name'       => $gData['label'] ?: 'Default',
                    'is_active'  => true,
                    'sort_order' => 0,
                ]);
            } else {
                $box->update(['name' => $gData['label'] ?: 'Default']);
            }
            $keepBoxIds[] = $box->id;

            // Each "box" in the UI is a FormTemplateField (flat, no nested fields[])
            foreach ($gData['boxes'] ?? [] as $bi => $bData) {
                $fieldAttrs = [
                    'form_template_id'      => $template->id,
                    'form_field_group_id'   => $group->id,
                    'form_field_box_id'     => $box->id,
                    'label'                 => $bData['label'] ?? '',
                    'field_key'             => $bData['field_key'] ?? '',
                    'field_type'            => $bData['field_type'] ?? 'text',
                    'box_size'              => $bData['box_size'] ?? 'middle',
                    'is_required'           => $bData['is_required'] ?? false,
                    'is_active'             => $bData['is_active'] ?? true,
                    'placeholder'           => $bData['placeholder'] ?: null,
                    'helper_text'           => $bData['helper_text'] ?: null,
                    'options'               => $bData['options'] ?: null,
                    'sort_order'            => $bi,
                    'conditional_field_key' => $bData['conditional_field_key'] ?: null,
                    'conditional_operator'  => $bData['conditional_operator'] ?: null,
                    'conditional_value'     => $bData['conditional_value'] ?: null,
                ];

                // field_id is the FormTemplateField id (box._box_id is the FormFieldBox id)
                $fieldId = $bData['field_id'] ?? null;
                if (! empty($fieldId) && $field = FormTemplateField::find($fieldId)) {
                    $field->update($fieldAttrs);
                } else {
                    $field = FormTemplateField::create($fieldAttrs);
                }
                $keepFieldIds[] = $field->id;
            }
        }

        // Delete removed records
        FormTemplateField::where('form_template_id', $template->id)
            ->whereNotIn('id', $keepFieldIds ?: [0])->delete();

        FormFieldBox::whereHas('group', fn ($q) => $q->where('form_template_id', $template->id))
            ->whereNotIn('id', $keepBoxIds ?: [0])->delete();

        FormFieldGroup::where('form_template_id', $template->id)
            ->whereNotIn('id', $keepGroupIds ?: [0])->delete();
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
                    ->modalDescription('Once published, branch admins and agencies can use this form.')
                    ->visible(fn (FormTemplate $r) => $r->status === 'draft')
                    ->action(function (FormTemplate $r) {
                        $r->update(['status' => 'published', 'is_active' => true]);
                        Notification::make()->title('Form published — now live to branches')->success()->send();
                    }),

                Tables\Actions\Action::make('unpublish')
                    ->label('Unpublish')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Unpublish this form?')
                    ->modalDescription('Branches will no longer be able to use this form.')
                    ->visible(fn (FormTemplate $r) => $r->status === 'published')
                    ->action(function (FormTemplate $r) {
                        $r->update(['status' => 'draft']);
                        Notification::make()->title('Form unpublished — moved back to draft')->warning()->send();
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
