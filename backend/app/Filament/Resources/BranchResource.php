<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BranchResource\Pages;
use App\Mail\BranchAdminCredentialsMail;
use App\Models\Branch;
use App\Models\TensaiNotification;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Mail;
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
        $isCreate = $form->getOperation() === 'create';

        return $form->schema([

            // ── CREATE: simple 2-section form ──────────────────────────────
            Forms\Components\Section::make('Branch Info')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Branch Name')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn ($state, callable $set) =>
                            $set('slug', Str::slug($state))),

                    Forms\Components\Hidden::make('slug')
                        ->dehydrateStateUsing(fn ($state, $get) => $state ?: Str::slug($get('name'))),

                    Forms\Components\TextInput::make('city')
                        ->required()
                        ->placeholder('e.g. Dhaka'),

                    Forms\Components\TextInput::make('country')
                        ->required()
                        ->default('Bangladesh'),
                ])
                ->columns(2)
                ->visibleOn('create'),

            Forms\Components\Section::make('Manager Account')
                ->description('Manager will log in with their name and password.')
                ->schema([
                    Forms\Components\TextInput::make('manager_name')
                        ->label('Manager Name (Login Username)')
                        ->required()
                        ->maxLength(255)
                        ->helperText('Manager logs in with this name + password. Must be unique.')
                        ->unique('users', 'name')
                        ->dehydrated(false),

                    Forms\Components\TextInput::make('manager_password')
                        ->label('Password')
                        ->password()
                        ->revealable()
                        ->required()
                        ->minLength(6)
                        ->helperText('Copy and send to manager manually.')
                        ->dehydrated(false),

                    Forms\Components\TextInput::make('manager_password_confirmation')
                        ->label('Confirm Password')
                        ->password()
                        ->revealable()
                        ->required()
                        ->minLength(6)
                        ->dehydrated(false)
                        ->rules([
                            fn (\Filament\Forms\Get $get): \Closure => function (string $attribute, $value, \Closure $fail) use ($get) {
                                if ($value !== $get('manager_password')) {
                                    $fail('Passwords do not match.');
                                }
                            },
                        ]),

                    Forms\Components\TextInput::make('manager_phone')
                        ->label('Phone')
                        ->placeholder('+880 1XXX-XXXXXX')
                        ->dehydrated(false),

                    Forms\Components\TextInput::make('manager_whatsapp')
                        ->label('WhatsApp')
                        ->placeholder('8801XXXXXXXXX')
                        ->dehydrated(false),
                ])
                ->columns(2)
                ->visibleOn('create'),

            // ── EDIT: full detail form ──────────────────────────────────────
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

                Forms\Components\TextInput::make('city')->required()->placeholder('e.g. Dhaka'),
                Forms\Components\TextInput::make('country')->default('Bangladesh'),
            ])->columns(2)->visibleOn('edit'),

            Forms\Components\Section::make('Contact Information')->schema([
                Forms\Components\TextInput::make('address')->columnSpanFull(),
                Forms\Components\TextInput::make('phone')->placeholder('+880 1XXX-XXXXXX'),
                Forms\Components\TextInput::make('email')->email()->placeholder('branch@tensai.jp'),
                Forms\Components\TextInput::make('whatsapp')->label('WhatsApp')->placeholder('8801XXXXXXXXX'),
                Forms\Components\TextInput::make('google_maps_url')->label('Google Maps URL')->url(),
            ])->columns(2)->visibleOn('edit'),

            Forms\Components\Section::make('Branding')->schema([
                Forms\Components\FileUpload::make('logo')
                    ->image()
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('branches/logos')
                    ->visibility('public')
                    ->maxSize(2048)
                    ->label('Branch Logo')
                    ->helperText('Recommended: 400×400px, PNG/JPG, max 2 MB'),

                Forms\Components\FileUpload::make('cover_image')
                    ->image()
                    ->disk(app()->environment('production') ? 'r2' : 'public')
                    ->directory('branches/covers')
                    ->visibility('public')
                    ->maxSize(5120)
                    ->label('Cover Image')
                    ->helperText('Recommended: 1200×400px, JPG, max 5 MB'),
            ])->columns(2)->visibleOn('edit'),

            Forms\Components\Section::make('Working Hours')->schema([
                Forms\Components\KeyValue::make('working_hours')
                    ->keyLabel('Day / Period')->valueLabel('Hours')
                    ->default(['Mon - Fri' => '9:00 AM – 6:00 PM', 'Saturday' => '10:00 AM – 2:00 PM', 'Sunday' => 'Closed'])
                    ->columnSpanFull(),
            ])->visibleOn('edit'),

            Forms\Components\Section::make('Social Links')->schema([
                Forms\Components\KeyValue::make('social_links')
                    ->keyLabel('Platform')->valueLabel('URL')
                    ->columnSpanFull(),
            ])->visibleOn('edit'),

            Forms\Components\Section::make('Branch Stats')->schema([
                Forms\Components\KeyValue::make('stats')
                    ->keyLabel('Label')->valueLabel('Value')
                    ->default(['Students Placed' => '0', 'Years Active' => '1', 'Visa Success Rate' => '95%'])
                    ->columnSpanFull(),
            ])->visibleOn('edit'),

            Forms\Components\Section::make('Status')->schema([
                Forms\Components\Toggle::make('is_active')->label('Active (visible on website)')->default(true),
                Forms\Components\TextInput::make('sort_order')->numeric()->default(0)->label('Sort Order'),
            ])->columns(2)->visibleOn('edit'),

            Forms\Components\Section::make('Branch Manager')
                ->description('Update manager credentials. Leave password blank to keep existing.')
                ->schema([
                    Forms\Components\TextInput::make('manager_name_edit')
                        ->label('Manager Name')
                        ->helperText('This name will be used as the manager\'s display name on the system.')
                        ->dehydrated(false)
                        ->afterStateHydrated(function ($component, $record) {
                            $admin = $record?->admins()->first();
                            $component->state($admin?->name ?? '');
                        }),

                    Forms\Components\TextInput::make('manager_password_edit')
                        ->label('New Password')
                        ->password()
                        ->revealable()
                        ->helperText('Leave blank to keep current password.')
                        ->dehydrated(false),

                    Forms\Components\TextInput::make('manager_phone_edit')
                        ->label('Phone')
                        ->dehydrated(false)
                        ->afterStateHydrated(function ($component, $record) {
                            $admin = $record?->admins()->first();
                            $component->state($admin?->phone ?? '');
                        }),

                    Forms\Components\TextInput::make('manager_whatsapp_edit')
                        ->label('WhatsApp')
                        ->dehydrated(false)
                        ->afterStateHydrated(function ($component, $record) {
                            $admin = $record?->admins()->first();
                            $component->state($admin?->whatsapp ?? '');
                        }),
                ])
                ->columns(2)
                ->visibleOn('edit'),
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
                    ->description(fn (Branch $r) => trim($r->city . ', ' . $r->country, ', ')),

                Tables\Columns\TextColumn::make('admins.name')
                    ->label('Manager (Login Username)')
                    ->placeholder('⚠ No manager')
                    ->badge()
                    ->color('success')
                    ->copyable()
                    ->copyMessage('Username copied!')
                    ->searchable(),

                Tables\Columns\TextColumn::make('admins.manager_plain_password')
                    ->label('Password')
                    ->placeholder('—')
                    ->copyable()
                    ->copyMessage('Password copied!')
                    ->icon('heroicon-o-key')
                    ->formatStateUsing(fn ($state) => $state ? '••••••' : '—')
                    ->tooltip(fn ($state) => $state),

                Tables\Columns\TextColumn::make('admins.phone')
                    ->label('Phone')
                    ->placeholder('—')
                    ->copyable()
                    ->icon('heroicon-o-phone'),

                Tables\Columns\TextColumn::make('admins.whatsapp')
                    ->label('WhatsApp')
                    ->placeholder('—')
                    ->copyable()
                    ->icon('heroicon-o-chat-bubble-left-ellipsis'),

                Tables\Columns\IconColumn::make('is_active')
                    ->label('Active')
                    ->boolean(),

                Tables\Columns\TextColumn::make('access_link')
                    ->label('Login Link')
                    ->getStateUsing(fn () => rtrim(config('app.frontend_url', config('app.url')), '/') . '/auth/login')
                    ->copyable()
                    ->copyMessage('Login URL copied!')
                    ->color('primary')
                    ->icon('heroicon-o-link'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Created')
                    ->dateTime('d M Y')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('sort_order')
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')->label('Active status'),
            ])
            ->actions([
                Tables\Actions\Action::make('assign_admin')
                    ->label('Assign Admin')
                    ->icon('heroicon-o-user-plus')
                    ->color('primary')
                    ->modalHeading(fn (Branch $record) => "Assign Admin — {$record->name}")
                    ->modalDescription(fn (Branch $record) => $record->admins()->exists()
                        ? '⚠️ This branch already has an admin. Creating another will add a second admin account.'
                        : null)
                    ->form([
                        Forms\Components\TextInput::make('name')
                            ->required()
                            ->label('Admin Name')
                            ->placeholder('e.g. Rahim Uddin'),
                        Forms\Components\TextInput::make('email')
                            ->email()
                            ->label('Login Email')
                            ->helperText('Leave blank to use the branch email.')
                            ->rules(['nullable', 'email', 'unique:users,email']),
                        Forms\Components\TextInput::make('password')
                            ->password()
                            ->required()
                            ->minLength(8)
                            ->label('Temporary Password')
                            ->helperText('Will be emailed to the admin.'),
                    ])
                    ->action(function (Branch $record, array $data) {
                        // Use branch email if no custom email provided
                        $email = $data['email'] ?: $record->email;

                        if (!$email) {
                            Notification::make()
                                ->title('Email required')
                                ->body('This branch has no email set. Either add an email to the branch or enter one here.')
                                ->danger()
                                ->send();
                            return;
                        }

                        if ($record->admins()->where('email', $email)->exists()) {
                            Notification::make()
                                ->title('Admin already exists')
                                ->body("An admin with email {$email} is already assigned to this branch.")
                                ->danger()
                                ->send();
                            return;
                        }

                        $user = User::create([
                            'name'                   => $data['name'],
                            'email'                  => $email,
                            'password'               => bcrypt($data['password']),
                            'gateway_type'           => 'branch',
                            'status'                 => 'active',
                            'branch_id'              => $record->id,
                            'manager_plain_password' => $data['password'],
                            'email_verified_at'      => now(),
                        ]);
                        $user->assignRole('branch_admin');

                        $loginUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/auth/login';
                        try {
                            Mail::to($email)->send(new BranchAdminCredentialsMail(
                                adminName:     $data['name'],
                                branchName:    $record->name,
                                email:         $email,
                                plainPassword: $data['password'],
                                loginUrl:      $loginUrl,
                            ));
                        } catch (\Throwable) {
                            // Mail failure should not block account creation
                        }

                        TensaiNotification::create([
                            'user_id'    => $user->id,
                            'type'       => 'info',
                            'title'      => 'Branch Admin Access Ready',
                            'body'       => "You have been assigned as admin for {$record->name}. Log in at {$loginUrl}.",
                            'action_url' => $loginUrl,
                        ]);

                        Notification::make()
                            ->title("Admin created for {$record->name}")
                            ->body("Credentials sent to {$email}")
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

    public static function getRelations(): array
    {
        return [
            \App\Filament\Resources\BranchResource\RelationManagers\AdminsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListBranches::route('/'),
            'create' => Pages\CreateBranch::route('/create'),
            'edit'   => Pages\EditBranch::route('/{record}/edit'),
        ];
    }
}
