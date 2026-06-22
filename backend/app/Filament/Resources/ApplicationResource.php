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

class ApplicationResource extends Resource
{
    protected static ?string $model          = Application::class;
    protected static ?string $navigationIcon  = 'heroicon-o-document-text';
    protected static ?string $navigationLabel = 'All Applications';
    protected static ?string $navigationGroup = 'Applicant Management';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([

            Forms\Components\Section::make('Application Details')
                ->icon('heroicon-o-document-text')
                ->columns(2)
                ->schema([
                    Forms\Components\Select::make('form_template_id')
                        ->label('Country Form')
                        ->options(
                            FormTemplate::where('status', 'published')
                                ->where('is_active', true)
                                ->pluck('name', 'id')
                        )
                        ->required()
                        ->searchable()
                        ->live()
                        ->columnSpanFull(),

                    Forms\Components\TextInput::make('student_name')
                        ->required()
                        ->label('Student Name')
                        ->prefixIcon('heroicon-o-user'),

                    Forms\Components\TextInput::make('student_email')
                        ->email()
                        ->label('Student Email')
                        ->prefixIcon('heroicon-o-envelope'),

                    Forms\Components\TextInput::make('student_phone')
                        ->label('Student Phone')
                        ->prefixIcon('heroicon-o-phone'),

                    Forms\Components\Select::make('status')
                        ->options([
                            'draft'     => 'Draft',
                            'submitted' => 'Submitted',
                            'accepted'  => 'Accepted',
                            'rejected'  => 'Rejected',
                        ])
                        ->default('draft')
                        ->required(),
                ]),

            Forms\Components\Section::make('Education Background')
                ->icon('heroicon-o-academic-cap')
                ->description('Fill in the student\'s education certificates as required by the selected country form.')
                ->visible(fn (Forms\Get $get) => filled($get('form_template_id')))
                ->schema([
                    Forms\Components\Repeater::make('form_data.educations')
                        ->label('')
                        ->schema(fn (Forms\Get $get): array => self::buildEducationSchema($get('form_template_id')))
                        ->addable(false)
                        ->deletable(false)
                        ->reorderable(false)
                        ->columnSpanFull(),
                ])
                ->collapsible(),

        ]);
    }

    protected static function buildEducationSchema(?int $templateId): array
    {
        if (! $templateId) return [];

        $template   = FormTemplate::find($templateId);
        $educations = $template?->educations ?? [];

        if (empty($educations)) return [
            Forms\Components\Placeholder::make('no_edu')
                ->label('')
                ->content('No education certificates configured for this country form.'),
        ];

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
                default     => '',
            };

            $fields[] = Forms\Components\Section::make("{$label}  {$badge}")
                ->schema([
                    Forms\Components\Grid::make(3)->schema([
                        Forms\Components\TextInput::make("form_data.edu_{$i}_institution")
                            ->label('Institution / Board')
                            ->placeholder('e.g. Dhaka Education Board'),

                        Forms\Components\TextInput::make("form_data.edu_{$i}_gpa")
                            ->label('GPA / Grade / Point')
                            ->placeholder('e.g. 5.00 / A+'),

                        Forms\Components\TextInput::make("form_data.edu_{$i}_year")
                            ->label('Passing Year')
                            ->placeholder('e.g. 2022')
                            ->numeric(),
                    ]),

                    Forms\Components\FileUpload::make("form_data.edu_{$i}_document")
                        ->label($requirement === 'mandatory' ? 'Certificate / Transcript (Required)' : 'Certificate / Transcript (Optional)')
                        ->disk('public')
                        ->directory('application-education-docs')
                        ->acceptedFileTypes(['application/pdf', 'image/jpeg', 'image/png'])
                        ->maxSize(5120)
                        ->downloadable()
                        ->columnSpanFull()
                        ->hintIcon($requirement === 'mandatory' ? 'heroicon-o-exclamation-circle' : 'heroicon-o-information-circle')
                        ->hintColor($requirement === 'mandatory' ? 'danger' : 'warning')
                        ->hint($requirement === 'mandatory' ? 'Must upload before submitting' : 'Optional — upload if available'),
                ])
                ->compact()
                ->collapsible();
        }

        return $fields;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('application_code')
                    ->label('Code')
                    ->searchable()
                    ->fontFamily('mono')
                    ->copyable(),

                Tables\Columns\TextColumn::make('student_name')
                    ->label('Student')
                    ->searchable()
                    ->description(fn (Application $r) => $r->student_email ?? ''),

                Tables\Columns\TextColumn::make('formTemplate.country')
                    ->label('Country')
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('submitted_by_role')
                    ->label('Submitted by')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'admin'        => 'purple',
                        'branch_admin' => 'info',
                        'agency'       => 'warning',
                        'student'      => 'success',
                        default        => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'admin'        => 'Admin',
                        'branch_admin' => 'Branch',
                        'agency'       => 'Agency',
                        'student'      => 'Student',
                        default        => $state,
                    }),

                Tables\Columns\TextColumn::make('progress')
                    ->label('Progress')
                    ->suffix('%')
                    ->badge()
                    ->color(fn (int $state) => $state >= 80 ? 'success' : ($state >= 50 ? 'warning' : 'danger')),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'accepted'  => 'success',
                        'submitted' => 'warning',
                        'rejected'  => 'danger',
                        default     => 'gray',
                    }),

                Tables\Columns\TextColumn::make('submitted_at')
                    ->label('Submitted')
                    ->dateTime('d M Y')
                    ->sortable()
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->since()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->striped()
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'draft'     => 'Draft',
                        'submitted' => 'Submitted',
                        'accepted'  => 'Accepted',
                        'rejected'  => 'Rejected',
                    ]),

                Tables\Filters\SelectFilter::make('submitted_by_role')
                    ->label('Submitted by')
                    ->options([
                        'admin'        => 'Admin',
                        'branch_admin' => 'Branch',
                        'agency'       => 'Agency',
                        'student'      => 'Student',
                    ]),

                Tables\Filters\SelectFilter::make('form_template_id')
                    ->label('Form / Country')
                    ->relationship('formTemplate', 'name'),
            ])
            ->actions([
                Tables\Actions\Action::make('accept')
                    ->label('Accept')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (Application $r) => $r->status === 'submitted')
                    ->action(function (Application $r) {
                        $r->update(['status' => 'accepted']);
                        Notification::make()->title('Application accepted')->success()->send();
                    }),

                Tables\Actions\Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (Application $r) => $r->status === 'submitted')
                    ->action(function (Application $r) {
                        $r->update(['status' => 'rejected']);
                        Notification::make()->title('Application rejected')->warning()->send();
                    }),

                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
