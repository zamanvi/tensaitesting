<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ContactPaperResource\Pages;
use App\Models\ContactPaper;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ContactPaperResource extends Resource
{
    protected static ?string $model = ContactPaper::class;
    protected static ?string $navigationIcon  = 'heroicon-o-envelope-open';
    protected static ?string $navigationGroup = 'Operations';
    protected static ?string $navigationLabel = 'Contact Requests';
    protected static ?int    $navigationSort  = 1;

    public static function getNavigationBadge(): ?string
    {
        return (string) ContactPaper::where('type', 'institution_contact_request')
            ->where('is_read', false)->count() ?: null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([

            Forms\Components\Section::make('Request Details')->schema([
                Forms\Components\TextInput::make('reference_number')
                    ->label('Reference #')
                    ->disabled(),

                Forms\Components\Select::make('type')
                    ->options([
                        'institution_contact_request' => '🏫 Institution Contact Request',
                        'interview_request'           => '📅 Interview Request',
                        'interview_confirmation'      => '✅ Interview Confirmation',
                        'selection_result'            => '🎯 Selection Result',
                        'offer_letter'                => '📄 Offer Letter',
                        'visa_status'                 => '🛂 Visa Status',
                        'enrollment_confirmation'     => '🎓 Enrollment Confirmation',
                        'general_notice'              => '📢 General Notice',
                    ])
                    ->disabled(),

                Forms\Components\TextInput::make('subject')
                    ->disabled()
                    ->columnSpanFull(),
            ])->columns(2),

            Forms\Components\Section::make('Message')->schema([
                Forms\Components\Textarea::make('body')
                    ->label('Message Body')
                    ->rows(5)
                    ->disabled()
                    ->columnSpanFull(),
            ]),

            Forms\Components\Section::make('Parties')->schema([
                Forms\Components\TextInput::make('from_user_id')
                    ->label('From (Institution)')
                    ->formatStateUsing(fn ($state) => \App\Models\User::find($state)?->name ?? $state)
                    ->disabled(),

                Forms\Components\TextInput::make('lead_id')
                    ->label('Lead')
                    ->formatStateUsing(fn ($state) => $state
                        ? (\App\Models\Lead::find($state)?->lead_code ?? "#$state")
                        : '—')
                    ->disabled(),
            ])->columns(2),

            Forms\Components\Section::make('Status')->schema([
                Forms\Components\Toggle::make('is_read')
                    ->label('Mark as Read')
                    ->helperText('Toggle to mark this request as read/handled.'),

                Forms\Components\DateTimePicker::make('acknowledged_at')
                    ->label('Acknowledged At')
                    ->nullable(),
            ])->columns(2),

        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('reference_number')
                    ->label('Ref #')
                    ->searchable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('type')
                    ->label('Type')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'institution_contact_request' => 'primary',
                        'interview_request'           => 'info',
                        'interview_confirmation'      => 'success',
                        'offer_letter'                => 'warning',
                        'visa_status'                 => 'danger',
                        default                       => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'institution_contact_request' => '🏫 Contact Request',
                        'interview_request'           => '📅 Interview Request',
                        'interview_confirmation'      => '✅ Confirmed',
                        'selection_result'            => '🎯 Selection',
                        'offer_letter'                => '📄 Offer Letter',
                        'visa_status'                 => '🛂 Visa',
                        'enrollment_confirmation'     => '🎓 Enrolled',
                        'general_notice'              => '📢 Notice',
                        default                       => $state,
                    }),

                Tables\Columns\TextColumn::make('sender.name')
                    ->label('From')
                    ->searchable(),

                Tables\Columns\TextColumn::make('lead.lead_code')
                    ->label('Lead')
                    ->searchable()
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('subject')
                    ->limit(50)
                    ->searchable(),

                Tables\Columns\IconColumn::make('is_read')
                    ->label('Read')
                    ->boolean(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Received')
                    ->since()
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                SelectFilter::make('type')
                    ->options([
                        'institution_contact_request' => '🏫 Contact Requests',
                        'interview_request'           => '📅 Interview Requests',
                        'offer_letter'                => '📄 Offer Letters',
                        'general_notice'              => '📢 General',
                    ]),
                Tables\Filters\TernaryFilter::make('is_read')->label('Read status'),
            ])
            ->actions([
                Tables\Actions\Action::make('mark_read')
                    ->label('Mark Read')
                    ->icon('heroicon-o-check')
                    ->color('success')
                    ->visible(fn (ContactPaper $r) => !$r->is_read)
                    ->action(fn (ContactPaper $r) => $r->update(['is_read' => true, 'read_at' => now()])),

                Tables\Actions\EditAction::make()->label('View / Edit'),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('mark_all_read')
                    ->label('Mark as Read')
                    ->icon('heroicon-o-check-circle')
                    ->action(fn ($records) => $records->each(fn ($r) => $r->update(['is_read' => true, 'read_at' => now()]))),
            ]);
    }

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListContactPapers::route('/'),
            'edit'  => Pages\EditContactPaper::route('/{record}/edit'),
        ];
    }
}
