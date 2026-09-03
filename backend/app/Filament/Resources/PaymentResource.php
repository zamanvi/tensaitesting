<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PaymentResource\Pages;
use App\Models\Application;
use App\Models\Payment;
use App\Models\PaymentCategory;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PaymentResource extends Resource
{
    protected static ?string $model         = Payment::class;
    protected static ?string $navigationIcon  = 'heroicon-o-receipt-percent';
    protected static ?string $navigationGroup = 'Revenue';
    protected static ?string $navigationLabel = 'Memos';
    protected static ?string $modelLabel       = 'Memo';
    protected static ?string $pluralModelLabel = 'Memos';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    // The branch dashboard is the everyday entry point (that's where the
    // auto-split/zero-waiting-time flow lives). Head office can also create
    // a memo directly here — e.g. for testing, or a correction/walk-in memo
    // not tied to any branch staff login — but a memo, once created, is an
    // immutable ledger row: no edit, no delete.
    public static function canEdit($record): bool { return false; }
    public static function canDelete($record): bool { return false; }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->columns(2)->schema([
                Forms\Components\Select::make('branch_id')
                    ->label('Branch')
                    ->relationship('branch', 'name')
                    ->required()
                    ->live()
                    ->searchable()
                    ->native(false)
                    ->afterStateUpdated(fn (Forms\Set $set) => $set('application_id', null)),

                Forms\Components\Select::make('application_id')
                    ->label('Application (optional)')
                    ->options(fn (Forms\Get $get) => $get('branch_id')
                        ? Application::where('branch_id', $get('branch_id'))
                            ->orderByDesc('id')
                            ->get()
                            ->mapWithKeys(fn ($a) => [$a->id => "{$a->application_code} — {$a->student_name}"])
                        : [])
                    ->searchable()
                    ->native(false)
                    ->live()
                    ->disabled(fn (Forms\Get $get) => !$get('branch_id'))
                    ->helperText('Filtered to the selected branch. Leave empty for a walk-in memo.')
                    ->afterStateUpdated(function (Forms\Set $set, Forms\Get $get, $state) {
                        if (!$state) return;
                        $app = Application::find($state);
                        if (!$app) return;
                        $set('customer_name', $app->student_name);
                        $set('customer_phone', $app->student_phone);
                        $set('customer_email', $app->student_email);
                    }),

                Forms\Components\Select::make('payment_category_id')
                    ->label('Category')
                    ->options(fn () => PaymentCategory::active()->pluck('label', 'id'))
                    ->required()
                    ->live()
                    ->native(false)
                    ->helperText(fn (Forms\Get $get) => match (PaymentCategory::find($get('payment_category_id'))?->fund_target) {
                        'branch'      => '→ routes to Branch Fund',
                        'head_office' => '→ routes to Head Office Fund',
                        default       => null,
                    }),

                Forms\Components\TextInput::make('amount')
                    ->required()
                    ->numeric()
                    ->minValue(1)
                    ->prefix('BDT'),

                Forms\Components\Select::make('method')
                    ->options(['cash' => 'Cash', 'bank' => 'Bank'])
                    ->default('cash')
                    ->required()
                    ->native(false),
            ]),

            Forms\Components\Section::make('Customer')->columns(3)->schema([
                Forms\Components\TextInput::make('customer_name')
                    ->required(fn (Forms\Get $get) => !filled($get('application_id')))
                    ->maxLength(255),
                Forms\Components\TextInput::make('customer_phone')->maxLength(30),
                Forms\Components\TextInput::make('customer_email')
                    ->email()
                    ->helperText('A receipt is emailed here on save, same as a branch-created memo.'),
            ]),

            Forms\Components\Textarea::make('notes')->rows(2)->columnSpanFull(),
        ]);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with(['branch', 'category', 'application']);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('receipt_no')
                    ->label('Receipt')
                    ->fontFamily('mono')
                    ->weight('bold')
                    ->searchable()
                    ->description(fn (Payment $r) => $r->created_at?->format('d M Y, H:i')),

                Tables\Columns\TextColumn::make('customer_name')
                    ->label('Customer')
                    ->searchable()
                    ->description(fn (Payment $r) => $r->application?->application_code),

                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->searchable(),

                Tables\Columns\TextColumn::make('category.label')
                    ->label('Category')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('fund_target')
                    ->label('Routes To')
                    ->badge()
                    ->formatStateUsing(fn ($state) => $state === 'branch' ? 'Branch Fund' : 'Head Office Fund')
                    ->color(fn ($state) => $state === 'branch' ? 'success' : 'info'),

                Tables\Columns\TextColumn::make('amount')
                    ->money(fn (Payment $r) => $r->currency)
                    ->sortable(),

                Tables\Columns\TextColumn::make('method')
                    ->badge()
                    ->color('gray')
                    ->formatStateUsing(fn ($state) => ucfirst($state)),
            ])
            ->filters([
                SelectFilter::make('branch_id')
                    ->label('Branch')
                    ->relationship('branch', 'name'),
                SelectFilter::make('payment_category_id')
                    ->label('Category')
                    ->relationship('category', 'label'),
                SelectFilter::make('fund_target')
                    ->options(['branch' => 'Branch Fund', 'head_office' => 'Head Office Fund']),
                Tables\Filters\Filter::make('created_range')
                    ->form([
                        \Filament\Forms\Components\DatePicker::make('from')->native(false),
                        \Filament\Forms\Components\DatePicker::make('until')->native(false),
                    ])
                    ->query(function (Builder $query, array $data) {
                        return $query
                            ->when($data['from'], fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
                            ->when($data['until'], fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
                    }),
            ])
            ->filtersLayout(Tables\Enums\FiltersLayout::AboveContentCollapsible)
            ->actions([
                Tables\Actions\ViewAction::make(),
            ])
            ->emptyStateHeading('No memos yet')
            ->emptyStateDescription('Branch memos will appear here as soon as they are created.')
            ->emptyStateIcon('heroicon-o-receipt-percent')
            ->emptyStateActions([
                Tables\Actions\CreateAction::make()->label('Create Memo'),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListPayments::route('/'),
            'create' => Pages\CreatePayment::route('/create'),
            'view'   => Pages\ViewPayment::route('/{record}'),
        ];
    }
}
