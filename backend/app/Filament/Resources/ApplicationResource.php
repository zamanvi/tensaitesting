<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ApplicationResource\Pages;
use App\Models\Application;
use App\Models\FormTemplate;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Builder;

class ApplicationResource extends Resource
{
    protected static ?string $model         = Application::class;
    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    public static function getNavigationLabel(): string
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']) ? 'All Applications' : 'Applications';
    }

    protected static ?string $navigationGroup = 'Applicant Management';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin', 'branch_admin']);
    }

    public static function getEloquentQuery(): Builder
    {
        $user  = auth()->user();
        $query = parent::getEloquentQuery();

        if ($user->hasRole(['super_admin', 'admin'])) {
            // Hide agency drafts unless explicitly marked live
            return $query->where(function ($sub) {
                $sub->where('submitted_by_role', '!=', 'agency')
                    ->orWhere('status', '!=', 'draft')
                    ->orWhere('live_to_school', true);
            });
        }
        if ($user->hasRole('branch_admin')) return $query->where('branch_id', $user->branch_id);

        return $query->whereRaw('0 = 1');
    }

    // ── Form ─────────────────────────────────────────────────────────────────

    public static function form(Form $form): Form
    {
        return $form->schema([

            // Progress bar — edit only
            Forms\Components\View::make('filament.forms.components.application-progress')
                ->hiddenOn('create'),

            // ── Country Form selector ─────────────────────────────────────────
            Forms\Components\Section::make()
                ->schema([
                    Forms\Components\Select::make('form_template_id')
                        ->label('Country Form')
                        ->options(fn () => FormTemplate::where('status', 'published')
                            ->where('is_active', true)
                            ->orderBy('country')
                            ->get()
                            ->mapWithKeys(fn ($t) => [
                                $t->id => implode(' — ', array_filter([$t->country, $t->name])),
                            ]))
                        ->required()
                        ->native(true)
                        ->live()
                        ->disabled(fn (string $operation) => $operation === 'edit')
                        ->dehydrated()
                        ->columnSpanFull()
                        ->placeholder('Select country / visa type…'),
                ]),

            // ── Personal Information (matches preview exactly) ────────────────
            Forms\Components\Section::make('Personal Information')
                ->icon('heroicon-o-user-circle')
                ->columns(2)
                ->visible(fn (Forms\Get $get) => filled($get('form_template_id')))
                ->schema(fn (Forms\Get $get): array => self::buildPersonalInfoFields(
                    filled($get('form_template_id')) ? (int) $get('form_template_id') : null
                )),

            // ── Dynamic template sections ─────────────────────────────────────
            Forms\Components\Group::make()
                ->schema(fn (Forms\Get $get): array => self::buildTemplateFieldSections(
                    filled($get('form_template_id')) ? (int) $get('form_template_id') : null
                ))
                ->visible(fn (Forms\Get $get) => filled($get('form_template_id')))
                ->columnSpanFull(),

            // ── Education Certificates ────────────────────────────────────────
            Forms\Components\Section::make('Education Certificates')
                ->icon('heroicon-o-academic-cap')
                ->visible(fn (Forms\Get $get) => filled($get('form_template_id')))
                ->schema(fn (Forms\Get $get): array => self::buildEducationSchema(
                    filled($get('form_template_id')) ? (int) $get('form_template_id') : null
                ))
                ->collapsible()
                ->collapsed(false),

        ]);
    }

    // ── Template info card (shown after country form is selected) ────────────

    protected static function buildTemplateInfoCard(?int $templateId): \Illuminate\Support\HtmlString
    {
        if (! $templateId) return new \Illuminate\Support\HtmlString('');

        $template = FormTemplate::find($templateId);
        if (! $template) return new \Illuminate\Support\HtmlString('');

        $country   = e($template->country ?? '');
        $visaType  = e($template->visa_type ?? '');
        $name      = e($template->name ?? '');
        $intakes   = $template->intake_options ?? [];
        $groupCount = $template->fieldGroups()
            ->where('is_active', true)
            ->where('label', '!=', 'Application Form Info')
            ->count();
        $eduCount = count($template->educations ?? []);

        // Flag emoji from country name (simple mapping)
        $flagMap = [
            'japan' => '🇯🇵', 'uk' => '🇬🇧', 'usa' => '🇺🇸', 'united states' => '🇺🇸',
            'canada' => '🇨🇦', 'australia' => '🇦🇺', 'germany' => '🇩🇪', 'france' => '🇫🇷',
            'south korea' => '🇰🇷', 'korea' => '🇰🇷', 'china' => '🇨🇳', 'malaysia' => '🇲🇾',
            'singapore' => '🇸🇬', 'new zealand' => '🇳🇿', 'ireland' => '🇮🇪',
            'netherlands' => '🇳🇱', 'sweden' => '🇸🇪', 'finland' => '🇫🇮',
            'bangladesh' => '🇧🇩', 'india' => '🇮🇳', 'pakistan' => '🇵🇰',
        ];
        $flag = $flagMap[strtolower($country)] ?? '🌍';

        $metaParts = [];
        if ($groupCount > 0) $metaParts[] = "{$groupCount} custom section" . ($groupCount > 1 ? 's' : '');
        if ($eduCount > 0)   $metaParts[] = "{$eduCount} education certificate" . ($eduCount > 1 ? 's' : '');
        $meta = implode(' · ', $metaParts);

        // Build intake pills HTML
        $pillsHtml = '';
        if (! empty($intakes)) {
            $pillsHtml .= '<div style="margin-top:12px;">';
            $pillsHtml .= '<p style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9ca3af;margin:0 0 7px;">Select Intake</p>';
            $pillsHtml .= '<div style="display:flex;flex-wrap:wrap;gap:7px;" id="cap-pill-row">';
            foreach ($intakes as $intake) {
                $safe = e($intake);
                $pillsHtml .= "<button type='button'
                    class='cap-pill'
                    data-val='{$safe}'
                    onclick=\"capSelectIntake('{$safe}', this)\"
                    style=\"padding:6px 14px;border-radius:99px;border:1.5px solid #d1fae5;
                        background:#f0fdf4;color:#065f46;font-size:12.5px;font-weight:600;
                        cursor:pointer;font-family:inherit;transition:all .15s;\">
                    📅 {$safe}
                </button>";
            }
            $pillsHtml .= '</div></div>';
        }

        $html = "
        <div class='cap-tpl-card' style='background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid #a7f3d0;
            border-radius:12px;padding:16px 20px;display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;'>

            <div style='flex:1;min-width:200px;'>
                <div style='display:flex;align-items:center;gap:10px;flex-wrap:wrap;'>
                    <span style='font-size:24px;line-height:1;'>{$flag}</span>
                    <span style='font-size:16px;font-weight:800;color:#064e3b;'>{$country}</span>
                    " . ($visaType ? "<span style='font-size:11.5px;color:#6b7280;background:#fff;padding:3px 10px;border-radius:99px;border:1px solid #e5e7eb;font-weight:500;'>{$visaType}</span>" : '') . "
                </div>
                <p style='font-size:13.5px;font-weight:700;color:#1f2937;margin:6px 0 2px;'>{$name}</p>
                " . ($meta ? "<p style='font-size:11.5px;color:#6b7280;margin:0;'>{$meta}</p>" : '') . "
            </div>

            <div style='flex:1;min-width:220px;'>
                {$pillsHtml}
            </div>
        </div>
        <script>
        function capSelectIntake(value, btn) {
            // Update pills visual
            document.querySelectorAll('.cap-pill').forEach(function(p) {
                p.style.background = '#f0fdf4';
                p.style.borderColor = '#d1fae5';
                p.style.color = '#065f46';
                p.style.boxShadow = 'none';
            });
            btn.style.background = '#16a34a';
            btn.style.borderColor = '#16a34a';
            btn.style.color = '#fff';
            btn.style.boxShadow = '0 2px 8px rgba(22,163,74,.3)';

            // Set value via Livewire
            try {
                var wireEls = document.querySelectorAll('[wire\\\\:id]');
                wireEls.forEach(function(el) {
                    var id = el.getAttribute('wire:id');
                    var comp = window.Livewire ? window.Livewire.find(id) : null;
                    if (comp) {
                        try { comp.set('data.form_data.intake', value); } catch(e) {}
                    }
                });
            } catch(e) {}

            // Also set native select as fallback
            var sel = document.getElementById('cap-intake-select');
            if (!sel) sel = document.querySelector('[id*=\"intake\"]');
            if (sel) {
                sel.value = value;
                sel.dispatchEvent(new Event('change', {bubbles:true}));
            }
        }
        </script>
        ";

        return new \Illuminate\Support\HtmlString($html);
    }

    // ── Personal Information section — mirrors the form preview exactly ───────

    protected static function buildPersonalInfoFields(?int $templateId): array
    {
        $template = $templateId ? FormTemplate::find($templateId) : null;
        $intakes  = $template?->intake_options ?? [];

        $fields = [
            Forms\Components\TextInput::make('student_name')
                ->label('Full Name')
                ->required()
                ->prefixIcon('heroicon-o-user')
                ->columnSpan(1),

            Forms\Components\TextInput::make('student_email')
                ->label('Email Address')
                ->email()
                ->prefixIcon('heroicon-o-envelope')
                ->columnSpan(1),

            Forms\Components\TextInput::make('student_phone')
                ->label('Contact Number')
                ->required()
                ->prefixIcon('heroicon-o-phone')
                ->columnSpan(1),

            Forms\Components\TextInput::make('whatsapp_no')
                ->label('WhatsApp Number')
                ->prefixIcon('heroicon-o-chat-bubble-left-right')
                ->columnSpan(1),

            Forms\Components\DatePicker::make('form_data.birth_date')
                ->label('Date of Birth')
                ->displayFormat('d M Y')
                ->prefixIcon('heroicon-o-calendar-days')
                ->columnSpan(1),

            Forms\Components\TextInput::make('form_data.passport_no')
                ->label('Passport Number')
                ->placeholder('e.g. AB1234567')
                ->prefixIcon('heroicon-o-identification')
                ->columnSpan(1),
        ];

        // Intake selector — shown in the info card as pills; hidden native select stores the value
        if (! empty($intakes)) {
            $fields[] = Forms\Components\Select::make('form_data.intake')
                ->label('Select Intake')
                ->options(collect($intakes)->mapWithKeys(fn ($i) => [$i => $i]))
                ->placeholder('Choose intake…')
                ->native(true)
                ->extraAttributes(['class' => 'cap-intake-hidden-select', 'id' => 'cap-intake-select'])
                ->columnSpan(1);
        }

        $fields[] = Forms\Components\Textarea::make('permanent_address')
            ->label('Permanent Address')
            ->placeholder('House, Road, Area, City, Postcode')
            ->rows(2)
            ->columnSpanFull();

        // Admin-only: status control (edit only)
        $fields[] = Forms\Components\Select::make('status')
            ->label('Application Status')
            ->options([
                'draft'     => 'Draft',
                'submitted' => 'Submitted',
                'accepted'  => 'Accepted',
                'rejected'  => 'Rejected',
            ])
            ->default('draft')
            ->required()
            ->native(false)
            ->hiddenOn('create')
            ->columnSpan(1);

        return $fields;
    }

    // ── Build dynamic form sections from FormFieldGroups ─────────────────────

    protected static function buildTemplateFieldSections(?int $templateId): array
    {
        if (! $templateId) return [];

        $template = FormTemplate::with([
            'fieldGroups' => fn ($q) => $q
                ->where('is_active', true)
                ->where('label', '!=', 'Application Form Info')
                ->orderBy('sort_order'),
            'fieldGroups.boxes' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            'fieldGroups.boxes.fields' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
        ])->find($templateId);

        if (! $template || $template->fieldGroups->isEmpty()) return [];

        $sections = [];

        foreach ($template->fieldGroups as $group) {
            $groupContent = [];

            foreach ($group->boxes as $box) {
                $fields = $box->fields;
                if ($fields->isEmpty() && ! $box->requires_document) continue;

                $boxFields = [];
                foreach ($fields as $field) {
                    $comp = match ($field->field_type) {
                        'textarea' => Forms\Components\Textarea::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->placeholder($field->placeholder ?? '')
                            ->rows(3)
                            ->required((bool) $field->is_required),

                        'select' => Forms\Components\Select::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->options(collect($field->options ?? [])->mapWithKeys(fn ($o) => [$o => $o]))
                            ->placeholder($field->placeholder ?? 'Choose…')
                            ->required((bool) $field->is_required)
                            ->native(false)
                            ->live(),

                        'date' => Forms\Components\DatePicker::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->displayFormat('d M Y')
                            ->required((bool) $field->is_required),

                        'file' => Forms\Components\FileUpload::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->disk('public')
                            ->directory('application-docs')
                            ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
                            ->maxSize(5120)
                            ->downloadable()
                            ->required((bool) $field->is_required),

                        'number' => Forms\Components\TextInput::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->numeric()
                            ->placeholder($field->placeholder ?? '')
                            ->required((bool) $field->is_required),

                        'email' => Forms\Components\TextInput::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->email()
                            ->placeholder($field->placeholder ?? '')
                            ->required((bool) $field->is_required),

                        'tel' => Forms\Components\TextInput::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->tel()
                            ->placeholder($field->placeholder ?? '')
                            ->required((bool) $field->is_required),

                        default => Forms\Components\TextInput::make("form_data.{$field->field_key}")
                            ->label($field->label)
                            ->placeholder($field->placeholder ?? '')
                            ->required((bool) $field->is_required),
                    };

                    // Apply conditional visibility matching frontend isFieldVisible() logic
                    if ($field->conditional_field_key && $field->conditional_operator) {
                        $condKey = "form_data.{$field->conditional_field_key}";
                        $condOp  = $field->conditional_operator;
                        $condVal = $field->conditional_value ?? '';

                        $comp = $comp->visible(fn (Forms\Get $get) => match ($condOp) {
                            'is'           => ($get($condKey) ?? '') === $condVal,
                            'is_not'       => ($get($condKey) ?? '') !== $condVal,
                            'is_empty'     => ! filled($get($condKey)),
                            'is_not_empty' => filled($get($condKey)),
                            default        => true,
                        });
                    }

                    // Map box_size → column span in a 2-col grid
                    $boxFields[] = $comp->columnSpan(
                        $field->box_size === 'full' ? 'full' : 1
                    );
                }

                // Box-level document upload
                if ($box->requires_document) {
                    $boxFields[] = Forms\Components\FileUpload::make("form_data.boxdoc_{$box->id}")
                        ->label(($box->doc_label ?: 'Supporting Document') . ($box->document_required ? ' *' : ''))
                        ->disk('public')
                        ->directory('application-docs')
                        ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                        ->maxSize(5120)
                        ->downloadable()
                        ->required((bool) $box->document_required)
                        ->columnSpanFull();
                }

                if (! empty($boxFields)) {
                    $subsection = Forms\Components\Section::make($box->name ?: '')
                        ->schema($boxFields)
                        ->columns(2)
                        ->compact()
                        ->extraAttributes(['class' => 'bg-slate-50/50']);

                    $groupContent[] = $subsection;
                }
            }

            if (! empty($groupContent)) {
                $sections[] = Forms\Components\Section::make($group->label)
                    ->icon('heroicon-o-document-text')
                    ->description($group->hint ?: null)
                    ->schema($groupContent)
                    ->collapsible()
                    ->collapsed(false)
                    ->columnSpanFull();
            }
        }

        return $sections;
    }

    // ── Build education certificate sub-form ─────────────────────────────────

    protected static function buildEducationSchema(?int $templateId): array
    {
        if (! $templateId) return [];

        $template   = FormTemplate::find($templateId);
        $educations = $template?->educations ?? [];

        if (empty($educations)) {
            return [
                Forms\Components\Placeholder::make('no_edu')
                    ->label('')
                    ->content('No education certificates configured for this country form.'),
            ];
        }

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
            $badge       = match ($requirement) {
                'mandatory' => '🔴 Mandatory',
                'optional'  => '📎 Optional',
                default     => '',
            };

            $fields[] = Forms\Components\Section::make("{$label}  {$badge}")
                ->schema([
                    Forms\Components\Grid::make(3)->schema([
                        Forms\Components\TextInput::make("form_data.edu_{$i}_institution")
                            ->label('Institution / Board')
                            ->placeholder('e.g. Dhaka Education Board'),

                        Forms\Components\TextInput::make("form_data.edu_{$i}_gpa")
                            ->label('GPA / Grade')
                            ->placeholder('e.g. 5.00 / A+'),

                        Forms\Components\TextInput::make("form_data.edu_{$i}_year")
                            ->label('Passing Year')
                            ->placeholder('e.g. 2022')
                            ->numeric(),
                    ]),

                    Forms\Components\FileUpload::make("form_data.edu_{$i}_document")
                        ->label($requirement === 'mandatory'
                            ? 'Certificate / Transcript — Required'
                            : 'Certificate / Transcript — Optional')
                        ->disk('public')
                        ->directory('application-education-docs')
                        ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                        ->maxSize(5120)
                        ->downloadable()
                        ->columnSpanFull()
                        ->hintIcon($requirement === 'mandatory'
                            ? 'heroicon-o-exclamation-circle'
                            : 'heroicon-o-information-circle')
                        ->hintColor($requirement === 'mandatory' ? 'danger' : 'warning')
                        ->hint($requirement === 'mandatory'
                            ? 'Must be uploaded before submitting'
                            : 'Optional — upload if available'),
                ])
                ->compact()
                ->collapsible()
                ->collapsed(false);
        }

        return $fields;
    }

    // ── Table ─────────────────────────────────────────────────────────────────

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                // #  Application code + created date
                Tables\Columns\TextColumn::make('application_code')
                    ->label('App. Code')
                    ->searchable()
                    ->fontFamily('mono')
                    ->copyable()
                    ->copyMessage('Copied!')
                    ->weight('bold')
                    ->description(fn (Application $r) => $r->created_at?->format('d M Y')),

                // Student name + email
                Tables\Columns\TextColumn::make('student_name')
                    ->label('Student')
                    ->searchable()
                    ->weight('semibold')
                    ->description(fn (Application $r) => $r->student_email ?? $r->student_phone ?? '—'),

                // Country + Form name
                Tables\Columns\TextColumn::make('formTemplate.country')
                    ->label('Country / Form')
                    ->searchable()
                    ->weight('semibold')
                    ->description(fn (Application $r) => $r->formTemplate?->name ?? '—'),

                // Intake from form_data
                Tables\Columns\TextColumn::make('intake')
                    ->label('Intake')
                    ->getStateUsing(fn (Application $r) => $r->form_data['intake'] ?? null)
                    ->badge()
                    ->color('info')
                    ->placeholder('—'),

                // Progress
                Tables\Columns\TextColumn::make('progress')
                    ->label('Progress')
                    ->suffix('%')
                    ->badge()
                    ->color(fn (int $state) => $state >= 80 ? 'success' : ($state >= 50 ? 'warning' : 'danger'))
                    ->sortable(),

                // Status badge (display only — no editing here)
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => ucfirst($state))
                    ->color(fn (string $state) => match ($state) {
                        'accepted'  => 'success',
                        'submitted' => 'warning',
                        'rejected'  => 'danger',
                        default     => 'gray',
                    }),

                // Source
                Tables\Columns\TextColumn::make('submitted_by_role')
                    ->label('Source')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'admin', 'super_admin' => 'gray',
                        'branch_admin', 'branch_manager' => 'info',
                        'agency'       => 'warning',
                        'student'      => 'success',
                        default        => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'admin', 'super_admin'            => 'Admin',
                        'branch_admin', 'branch_manager'  => 'Branch',
                        'agency'                          => 'Agency',
                        'student'                         => 'Student',
                        default                           => ucfirst($state),
                    }),

                // Created date
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Date')
                    ->since()
                    ->sortable()
                    ->toggleable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->paginated([15, 25, 50, 100])
            ->emptyStateHeading('No applications yet')
            ->emptyStateDescription('Create the first application using the button above.')
            ->emptyStateIcon('heroicon-o-document-text')
            ->emptyStateActions([
                Tables\Actions\Action::make('create')
                    ->label('New Application')
                    ->icon('heroicon-o-plus')
                    ->url(fn () => static::getUrl('create'))
                    ->color('success'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('submitted_by_role')
                    ->label('Source')
                    ->options([
                        'admin'        => 'Admin',
                        'branch_admin' => 'Branch',
                        'agency'       => 'Agency',
                        'student'      => 'Student',
                    ])
                    ->native(false),

                Tables\Filters\SelectFilter::make('form_template_id')
                    ->label('Country / Form')
                    ->relationship('formTemplate', 'name')
                    ->native(false),

                Tables\Filters\Filter::make('created_range')
                    ->label('Date Range')
                    ->form([
                        Forms\Components\DatePicker::make('from')->label('From')->native(false),
                        Forms\Components\DatePicker::make('until')->label('Until')->native(false),
                    ])
                    ->query(function (Builder $query, array $data) {
                        return $query
                            ->when($data['from'], fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                            ->when($data['until'], fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                    }),
            ])
            ->filtersLayout(Tables\Enums\FiltersLayout::AboveContentCollapsible)
            ->actions([
                Tables\Actions\Action::make('accept')
                    ->label('Accept')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (Application $r) =>
                        $r->status === 'submitted' &&
                        auth()->user()?->hasRole(['super_admin', 'admin']))
                    ->action(function (Application $r) {
                        $r->update(['status' => 'accepted']);
                        Notification::make()->title('Application accepted')->success()->send();
                    }),

                Tables\Actions\Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Application $r) =>
                        $r->status === 'submitted' &&
                        auth()->user()?->hasRole(['super_admin', 'admin']))
                    ->action(function (Application $r) {
                        $r->update(['status' => 'rejected']);
                        Notification::make()->title('Application rejected')->warning()->send();
                    }),

                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make()
                    ->visible(fn () => auth()->user()?->hasRole(['super_admin', 'admin'])),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\BulkAction::make('accept_all')
                        ->label('Accept selected')
                        ->icon('heroicon-o-check')
                        ->color('success')
                        ->action(fn ($records) => $records->each->update(['status' => 'accepted'])),
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListApplications::route('/'),
            'create' => Pages\CreateApplication::route('/create'),
            'view'   => Pages\ViewApplication::route('/{record}'),
            'edit'   => Pages\EditApplication::route('/{record}/edit'),
        ];
    }
}
