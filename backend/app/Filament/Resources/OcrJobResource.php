<?php

namespace App\Filament\Resources;

use App\Filament\Resources\OcrJobResource\Pages;
use App\Models\OcrJob;
use App\Models\StudentProfile;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;

class OcrJobResource extends Resource
{
    protected static ?string $model = OcrJob::class;
    protected static ?string $navigationIcon = 'heroicon-o-document-magnifying-glass';
    protected static ?string $navigationGroup = 'Verification';
    protected static ?string $navigationLabel = 'OCR Review Queue';
    protected static ?int $navigationSort = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Document Info')->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'name')
                    ->disabled(),
                Forms\Components\TextInput::make('document_type')->disabled(),
                Forms\Components\TextInput::make('confidence_score')
                    ->suffix('%')
                    ->disabled(),
                Forms\Components\Select::make('status')->options([
                    'queued'           => 'Queued',
                    'processing'       => 'Processing',
                    'completed'        => 'Completed',
                    'failed'           => 'Failed',
                    'review_requested' => 'Review Requested',
                    'manually_approved'=> 'Manually Approved',
                ]),
            ])->columns(2),

            Forms\Components\Section::make('Extracted Data')
                ->description('You can edit extracted values before approving.')
                ->schema([
                    Forms\Components\KeyValue::make('extracted_data')
                        ->label('Extracted Fields (editable)')
                        ->keyLabel('Field')
                        ->valueLabel('Value'),
                ]),

            Forms\Components\Section::make('Admin Review')->schema([
                Forms\Components\Textarea::make('reviewer_notes')
                    ->label('Admin Notes')
                    ->rows(3),
                Forms\Components\TextInput::make('failure_reason')
                    ->label('Failure / Rejection Reason')
                    ->disabled(),
                Forms\Components\Toggle::make('data_applied')
                    ->label('Data Applied to Profile'),
                Forms\Components\Select::make('reviewed_by')
                    ->relationship('reviewer', 'name')
                    ->disabled()
                    ->label('Reviewed By'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Student')
                    ->searchable()
                    ->sortable()
                    ->description(fn (OcrJob $r) => $r->user?->email),

                Tables\Columns\TextColumn::make('document_type')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'passport'     => 'info',
                        'nid_student'  => 'warning',
                        default        => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => ucwords(str_replace('_', ' ', $state))),

                Tables\Columns\TextColumn::make('confidence_score')
                    ->label('Confidence')
                    ->suffix('%')
                    ->sortable()
                    ->color(fn ($state) => $state === null ? 'gray' : ($state >= 80 ? 'success' : ($state >= 50 ? 'warning' : 'danger'))),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'queued'            => 'gray',
                        'processing'        => 'warning',
                        'completed'         => 'success',
                        'manually_approved' => 'success',
                        'failed'            => 'danger',
                        'review_requested'  => 'info',
                        default             => 'gray',
                    }),

                Tables\Columns\IconColumn::make('data_applied')
                    ->boolean()
                    ->label('Applied'),

                Tables\Columns\TextColumn::make('reviewer.name')
                    ->label('Reviewed By')
                    ->placeholder('â€”')
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')->options([
                    'review_requested' => 'Needs Review',
                    'failed'           => 'Failed',
                    'queued'           => 'Queued',
                    'completed'        => 'Completed',
                ]),
                SelectFilter::make('document_type')->options([
                    'passport'                    => 'Passport',
                    'nid_student'                 => 'NID',
                    'birth_certificate_student'   => 'Birth Certificate',
                    'ssc_certificate'             => 'SSC Certificate',
                    'hsc_certificate'             => 'HSC Certificate',
                    'jlpt_certificate'            => 'JLPT',
                    'ielts_certificate'           => 'IELTS',
                ]),
            ])
            ->actions([
                // â”€â”€ Approve & apply extracted data to student profile â”€â”€â”€â”€â”€â”€
                Tables\Actions\Action::make('approve')
                    ->label('Approve & Apply')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Approve OCR Job')
                    ->modalDescription('This will mark the job as completed and apply extracted data to the student profile.')
                    ->visible(fn (OcrJob $r) => !in_array($r->status, ['completed', 'manually_approved']))
                    ->action(function (OcrJob $record) {
                        $record->update([
                            'status'      => 'manually_approved',
                            'data_applied'=> true,
                            'reviewed_by' => auth()->id(),
                            'reviewed_at' => now(),
                        ]);

                        // Apply extracted data to student profile
                        $profile = $record->studentProfile;
                        $data    = $record->extracted_data ?? [];

                        if ($profile) {
                            match ($record->document_type) {
                                'passport' => $profile->update([
                                    'passport_number' => $data['passport_number'] ?? $profile->passport_number,
                                    'full_name'       => $data['full_name']       ?? $profile->full_name,
                                    'date_of_birth'   => $data['date_of_birth']   ?? $profile->date_of_birth,
                                    'nationality'     => $data['nationality']     ?? $profile->nationality,
                                    'passport_expiry' => $data['expiry_date']     ?? $profile->passport_expiry,
                                    'is_ocr_verified' => true,
                                    'ocr_status'      => 'verified',
                                ]),
                                'nid_student' => $profile->update([
                                    'nid_number'      => $data['nid_number']      ?? $profile->nid_number,
                                    'is_ocr_verified' => true,
                                ]),
                                default => null,
                            };
                        }

                        Notification::make()
                            ->title('OCR job approved and data applied to student profile.')
                            ->success()
                            ->send();
                    }),

                // â”€â”€ Reject with reason â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                Tables\Actions\Action::make('reject')
                    ->label('Reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn (OcrJob $r) => !in_array($r->status, ['failed']))
                    ->form([
                        Forms\Components\Textarea::make('reason')
                            ->label('Rejection Reason')
                            ->required()
                            ->rows(3)
                            ->placeholder('e.g. Document is blurry, wrong document type uploaded...'),
                    ])
                    ->action(function (OcrJob $record, array $data) {
                        $record->update([
                            'status'         => 'failed',
                            'failure_reason' => $data['reason'],
                            'reviewed_by'    => auth()->id(),
                            'reviewed_at'    => now(),
                        ]);

                        Notification::make()
                            ->title('OCR job rejected.')
                            ->warning()
                            ->send();
                    }),

                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListOcrJobs::route('/'),
            'create' => Pages\CreateOcrJob::route('/create'),
            'edit'   => Pages\EditOcrJob::route('/{record}/edit'),
        ];
    }
}
