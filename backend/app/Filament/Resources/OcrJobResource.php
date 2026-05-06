<?php

namespace App\Filament\Resources;

use App\Filament\Resources\OcrJobResource\Pages;
use App\Models\OcrJob;
use Filament\Forms;
use Filament\Forms\Form;
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

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Document Info')->schema([
                Forms\Components\Select::make('user_id')->relationship('user', 'name')->disabled(),
                Forms\Components\TextInput::make('document_type')->disabled(),
                Forms\Components\TextInput::make('confidence_score')->suffix('%')->disabled(),
                Forms\Components\Select::make('status')->options([
                    'queued' => 'Queued',
                    'processing' => 'Processing',
                    'completed' => 'Completed',
                    'failed' => 'Failed',
                    'review_requested' => 'Review Requested',
                ]),
            ])->columns(2),

            Forms\Components\Section::make('Extracted Data')->schema([
                Forms\Components\KeyValue::make('extracted_data')->disabled(),
            ]),

            Forms\Components\Section::make('Admin Review (Manual Bypass)')->schema([
                Forms\Components\Textarea::make('reviewer_notes')
                    ->label('Admin Notes / Manual Override')
                    ->rows(4),
                Forms\Components\Toggle::make('data_applied')->label('Mark Data Applied to Profile'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('document_type')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'passport' => 'info',
                        'nid' => 'warning',
                        'certificate', 'transcript' => 'success',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('confidence_score')->suffix('%')->sortable(),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state) => match($state) {
                        'queued' => 'gray',
                        'processing' => 'warning',
                        'completed' => 'success',
                        'failed' => 'danger',
                        'review_requested' => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\IconColumn::make('data_applied')->boolean(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('status')->options([
                    'review_requested' => 'Needs Review',
                    'failed' => 'Failed',
                    'queued' => 'Queued',
                ]),
                SelectFilter::make('document_type')->options([
                    'passport' => 'Passport',
                    'nid' => 'NID',
                    'certificate' => 'Certificate',
                ]),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->label('Approve & Apply')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (OcrJob $record) {
                        $record->update([
                            'status' => 'completed',
                            'data_applied' => true,
                            'reviewed_by' => auth()->id(),
                            'reviewed_at' => now(),
                        ]);
                    }),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOcrJobs::route('/'),
            'create' => Pages\CreateOcrJob::route('/create'),
            'edit' => Pages\EditOcrJob::route('/{record}/edit'),
        ];
    }
}
