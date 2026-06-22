<?php

namespace App\Filament\Resources;

use App\Filament\Resources\HelpRequestResource\Pages;
use App\Models\HelpRequest;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class HelpRequestResource extends Resource
{
    protected static ?string $model = HelpRequest::class;
    protected static ?string $navigationIcon = 'heroicon-o-lifebuoy';
    protected static ?string $navigationLabel = 'Help Requests';
    protected static ?string $navigationGroup = 'Support';
    protected static ?int $navigationSort = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) HelpRequest::where('status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Select::make('status')
                ->options([
                    'pending'     => 'Pending',
                    'in_progress' => 'In Progress',
                    'contacted'   => 'Contacted',
                    'resolved'    => 'Resolved',
                ])->required(),
            Forms\Components\Textarea::make('note')->label('Admin Note')->rows(3),
            Forms\Components\DateTimePicker::make('contacted_at')->label('Contacted At'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('Serial #')
                    ->sortable()
                    ->badge()
                    ->color('gray'),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Student Name')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.email')
                    ->label('Email')
                    ->searchable()
                    ->copyable(),
                Tables\Columns\TextColumn::make('document_type')
                    ->label('Document Type')
                    ->formatStateUsing(fn ($state) => ucwords(str_replace('_', ' ', $state ?? 'N/A')))
                    ->badge()
                    ->color('info'),
                Tables\Columns\TextColumn::make('contact_via')
                    ->label('Via')
                    ->badge()
                    ->color(fn ($state) => $state === 'whatsapp' ? 'success' : 'gray'),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => match ($state) {
                        'pending'     => 'warning',
                        'in_progress' => 'primary',
                        'contacted'   => 'info',
                        'resolved'    => 'success',
                        default       => 'gray',
                    }),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Requested')
                    ->dateTime('d M Y, H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending'     => 'Pending',
                        'in_progress' => 'In Progress',
                        'contacted'   => 'Contacted',
                        'resolved'    => 'Resolved',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('whatsapp')
                    ->label('WhatsApp')
                    ->icon('heroicon-o-chat-bubble-left-right')
                    ->color('success')
                    ->url(fn (HelpRequest $r) => 'https://wa.me/' . preg_replace('/[^0-9]/', '', $r->user->phone ?? '') . '?text=' . urlencode("Hi {$r->user->name}, this is Tensai support regarding your {$r->document_type} upload (Request #{$r->id}). How can we help?"))
                    ->openUrlInNewTab()
                    ->visible(fn (HelpRequest $r) => !empty($r->user->phone)),
                Tables\Actions\EditAction::make(),
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
            'index' => Pages\ListHelpRequests::route('/'),
            'edit'  => Pages\EditHelpRequest::route('/{record}/edit'),
        ];
    }
}
