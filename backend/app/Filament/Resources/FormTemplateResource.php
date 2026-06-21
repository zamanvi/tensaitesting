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
                Forms\Components\Section::make('Save Field')
                    ->icon('heroicon-o-archive-box')
                    ->schema([
                        SavedStructureField::make('saved_structure')
                            ->label('')
                            ->columnSpanFull(),
                    ]),
            ])->columnSpan(['lg' => 1]),

            // ── Full width: Custom Form Builder ───────────────────────────────
            Forms\Components\Section::make('')
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
            // Upsert FormFieldGroup (Field Title)
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

                // Each field = one Q/½/↔ input (FormTemplateField)
                foreach ($sData['fields'] ?? [] as $fi => $fData) {
                    $fieldAttrs = [
                        'form_template_id'      => $template->id,
                        'form_field_group_id'   => $group->id,
                        'form_field_box_id'     => $box->id,
                        'label'                 => $fData['label'] ?? '',
                        'field_key'             => $fData['field_key'] ?? '',
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
                    ->label('Form Name')
                    ->searchable()
                    ->color('gray'),

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
            ->emptyStateHeading('No application forms yet')
            ->emptyStateDescription('Create your first form template to start receiving applications from branches and agencies.')
            ->emptyStateIcon('heroicon-o-document-plus')
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
