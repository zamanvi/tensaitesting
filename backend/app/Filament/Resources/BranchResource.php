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

                Forms\Components\TextInput::make('city')->required()->placeholder('e.g. Dhaka'),
                Forms\Components\TextInput::make('country')->default('Bangladesh')->placeholder('e.g. Bangladesh'),
            ])->columns(2),

            Forms\Components\Section::make('Contact Information')->schema([
                Forms\Components\TextInput::make('address')->columnSpanFull(),
                Forms\Components\TextInput::make('phone')->placeholder('+880 1XXX-XXXXXX'),
                Forms\Components\TextInput::make('email')->email()->placeholder('branch@tensai.jp'),
                Forms\Components\TextInput::make('whatsapp')->label('WhatsApp Number')->placeholder('8801XXXXXXXXX')->helperText('International format without +'),
                Forms\Components\TextInput::make('google_maps_url')->label('Google Maps URL')->url()->placeholder('https://maps.google.com/...'),
            ])->columns(2),

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
                Forms\Components\TextInput::make('sort_order')->numeric()->default(0)->label('Sort Order')->helperText('Lower number = appears first'),
            ])->columns(2),

            Forms\Components\Section::make('Branch Admin')
                ->description('Current admin account assigned to this branch.')
                ->schema([
                    Forms\Components\Placeholder::make('admin_info')
                        ->label('Assigned Admin')
                        ->content(function ($record) {
                            if (!$record) return 'Save the branch first, then assign an admin from the list view.';
                            $admin = $record->admins()->first();
                            if (!$admin) return '⚠️ No admin assigned yet. Use the "Assign Admin" button on the branch list.';
                            return "✅ {$admin->name} ({$admin->email}) — Status: {$admin->status}";
                        })
                        ->columnSpanFull(),
                ])
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
                    ->label('Manager')
                    ->placeholder('⚠ No manager')
                    ->badge()
                    ->color('success')
                    ->searchable(),

                Tables\Columns\TextColumn::make('phone')
                    ->placeholder('—')
                    ->copyable()
                    ->icon('heroicon-o-phone'),

                Tables\Columns\TextColumn::make('email')
                    ->placeholder('—')
                    ->copyable()
                    ->icon('heroicon-o-envelope'),

                Tables\Columns\TextColumn::make('whatsapp')
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
