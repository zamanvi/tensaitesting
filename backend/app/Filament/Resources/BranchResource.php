<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchResource\Pages;
use App\Models\Branch;
use App\Models\TensaiNotification;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class BranchResource extends Resource
{
    protected static ?string $model = Branch::class;
    protected static ?string $navigationIcon  = 'heroicon-o-building-storefront';
    protected static ?string $navigationGroup = 'Branches';
    protected static ?string $navigationLabel = 'Branches';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([

            Forms\Components\Section::make('Branch Identity')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn ($state, callable $set) =>
                        $set('slug', Str::slug($state))),

                Forms\Components\TextInput::make('slug')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->helperText('Auto-generated. Used in URL: /branches/dhaka'),

                Forms\Components\TextInput::make('tagline')
                    ->placeholder('e.g. Your gateway to Japan from Dhaka')
                    ->maxLength(255),

                Forms\Components\Textarea::make('description')
                    ->rows(4)
                    ->columnSpanFull(),

                Forms\Components\TextInput::make('city')->required(),
                Forms\Components\TextInput::make('country')->default('Bangladesh'),
            ])->columns(2),

            Forms\Components\Section::make('Contact Information')->schema([
                Forms\Components\TextInput::make('address')->columnSpanFull(),
                Forms\Components\TextInput::make('phone'),
                Forms\Components\TextInput::make('email')->email(),
                Forms\Components\TextInput::make('whatsapp')->label('WhatsApp Number'),
                Forms\Components\TextInput::make('google_maps_url')->label('Google Maps URL')->url(),
            ])->columns(2),

            Forms\Components\Section::make('Branding')->schema([
                Forms\Components\FileUpload::make('logo')
                    ->image()
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('branches/logos')
                    ->visibility('public')
                    ->maxSize(2048)
                    ->label('Branch Logo'),

                Forms\Components\FileUpload::make('cover_image')
                    ->image()
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('branches/covers')
                    ->visibility('public')
                    ->maxSize(5120)
                    ->label('Cover Image'),
            ])->columns(2),

            Forms\Components\Section::make('Working Hours')->schema([
                Forms\Components\KeyValue::make('working_hours')
                    ->label('Working Hours')
                    ->keyLabel('Day / Period')
                    ->valueLabel('Hours')
                    ->default(['Mon - Fri' => '9:00 AM – 6:00 PM', 'Saturday' => '10:00 AM – 2:00 PM', 'Sunday' => 'Closed'])
                    ->columnSpanFull(),
            ]),

            Forms\Components\Section::make('Social Links')->schema([
                Forms\Components\KeyValue::make('social_links')
                    ->label('Social Media Links')
                    ->keyLabel('Platform')
                    ->valueLabel('URL')
                    ->columnSpanFull(),
            ]),

            Forms\Components\Section::make('Branch Stats')->schema([
                Forms\Components\KeyValue::make('stats')
                    ->label('Stats (shown on landing page)')
                    ->keyLabel('Label')
                    ->valueLabel('Value')
                    ->default(['Students Placed' => '0', 'Years Active' => '1', 'Visa Success Rate' => '95%'])
                    ->columnSpanFull(),
            ]),

            Forms\Components\Section::make('Status')->schema([
                Forms\Components\Toggle::make('is_active')->label('Active (visible on website)')->default(true),
                Forms\Components\TextInput::make('sort_order')->numeric()->default(0)->label('Sort Order'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->description(fn (Branch $r) => $r->city . ', ' . $r->country),

                Tables\Columns\TextColumn::make('slug')
                    ->label('URL Slug')
                    ->prefix('/branches/')
                    ->copyable()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('phone')->placeholder('—'),
                Tables\Columns\TextColumn::make('email')->placeholder('—'),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('sort_order')
                    ->label('Order')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')->label('Active status'),
            ])
            ->actions([
                // Send credentials to branch admin
                Tables\Actions\Action::make('send_credentials')
                    ->label('Assign Admin')
                    ->icon('heroicon-o-user-plus')
                    ->color('primary')
                    ->form([
                        Forms\Components\TextInput::make('name')->required()->label('Admin Name'),
                        Forms\Components\TextInput::make('email')->email()->required()->label('Admin Email'),
                        Forms\Components\TextInput::make('password')
                            ->password()
                            ->required()
                            ->minLength(8)
                            ->label('Temporary Password'),
                    ])
                    ->action(function (Branch $record, array $data) {
                        $user = User::create([
                            'name'          => $data['name'],
                            'email'         => $data['email'],
                            'password'      => bcrypt($data['password']),
                            'gateway_type'  => 'admin',
                            'status'        => 'active',
                            'branch_id'     => $record->id,
                        ]);
                        $user->assignRole('branch_admin');

                        // Send welcome notification
                        TensaiNotification::create([
                            'user_id'    => $user->id,
                            'type'       => 'info',
                            'title'      => 'Branch Admin Access Ready',
                            'body'       => "You have been assigned as admin for {$record->name}. Login at /admin with your credentials.",
                            'action_url' => '/admin',
                        ]);

                        Notification::make()
                            ->title("Branch admin created for {$record->name}")
                            ->body("Email: {$data['email']}")
                            ->success()
                            ->send();
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

    public static function getRelations(): array { return []; }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListBranches::route('/'),
            'create' => Pages\CreateBranch::route('/create'),
            'edit'   => Pages\EditBranch::route('/{record}/edit'),
        ];
    }
}
