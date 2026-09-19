<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ManagerResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ManagerResource extends Resource
{
    protected static ?string $model = User::class;
    protected static ?string $navigationIcon = 'heroicon-o-user-group';
    protected static ?string $navigationGroup = 'Settings';
    protected static ?string $navigationLabel = 'Managers';
    protected static ?int $navigationSort = 3;

    public static function canAccess(): bool
    {
        // Cast, not just the nullsafe call alone — with no authenticated
        // user (session expired, or Filament checking this during
        // unauthenticated navigation resolution) auth()->user()?->hasRole()
        // evaluates to null, which violates the `: bool` return type and
        // throws a 500 instead of the plain "redirect to login" this page
        // should get when logged out.
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin']);
    }
    protected static ?string $slug = 'managers';

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()->whereHas('roles', fn ($q) => $q->where('name', 'manager'));
    }

    // Every resource AND custom page a Manager could conceivably be
    // granted — matches the Admin panel's own sidebar exactly (see
    // ManagerPanelProvider::resolveResources()/resolvePages(), which read
    // this same selection back at login time). Excludes: ManagerResource
    // and UserResource, since canAccess() on both hard-blocks anyone
    // without the admin/super_admin role regardless of what's checked
    // here; Dashboard, which every manager gets automatically; and any
    // resource/page that doesn't register its own nav item (e.g. Memo
    // Categories, reached only via a button inside Memos) — those aren't
    // independently-visible "sections", so a checkbox for one would look
    // real but grant access to a page nothing ever links to.
    //
    // Flat [class => "Group — Label"] rather than a nested [group =>
    // [class => label]] array — Filament's CheckboxList in the installed
    // version doesn't support grouped options the way Select does
    // (isOptionDisabled() expects a string label and blew up on the
    // group's sub-array). The group name folded into the label text still
    // reads as grouped once sorted.
    private static function discoverSectionOptions(): array
    {
        $options = [];

        $collect = function (string $dir, string $namespace) use (&$options) {
            foreach (glob(app_path($dir) . '/*.php') as $file) {
                $class = $namespace . '\\' . basename($file, '.php');
                if (!class_exists($class)) continue;
                if (in_array($class, [
                    self::class,
                    UserResource::class,
                    \App\Filament\Pages\Dashboard::class,
                    // Statement is a printable report generated entirely
                    // from Memo data (see MemoStatement's own doc comment)
                    // — it has nothing of its own to grant. A manager with
                    // Memos access gets it for free instead of it eating a
                    // second checkbox that would always be ticked alongside
                    // Memos anyway.
                    \App\Filament\Pages\MemoStatement::class,
                ], true)) continue;
                if (!$class::shouldRegisterNavigation()) continue;

                $group = $class::getNavigationGroup() ?? 'General';
                $options[$class] = "{$group} — {$class::getNavigationLabel()}";
            }
        };

        $collect('Filament/Resources', 'App\\Filament\\Resources');
        $collect('Filament/Pages', 'App\\Filament\\Pages');

        asort($options);

        return $options;
    }

    // The class names behind discoverSectionOptions(), for
    // ManagerPanelProvider to register on the manager panel. Deliberately
    // NOT filtered by the current user here — Panel::panel() runs during
    // service-provider boot, before the session/auth middleware has run, so
    // auth()->user() is always null at that point regardless of who's
    // actually logged in. Every grantable class gets registered
    // unconditionally instead; each one's own canAccess() (checked later,
    // per-request, once auth is actually available) is what really decides
    // whether a given manager can reach it — see ManagerAccess::granted().
    public static function grantableClasses(): array
    {
        return array_keys(self::discoverSectionOptions());
    }

    public static function form(Form $form): Form
    {
        $sections = self::discoverSectionOptions();

        return $form->schema([
            Forms\Components\Section::make('Manager Account')->schema([
                Forms\Components\TextInput::make('name')
                    ->required()->maxLength(255),
                Forms\Components\TextInput::make('designation')
                    ->label('Designation')
                    ->placeholder('e.g. Revenue Manager')
                    ->helperText('A label for what this account is for — shown next to their sections.')
                    ->maxLength(100),
                // Only shown when editing — on create, a username (stored in
                // the `email` column, since that's what the manager panel's
                // login form asks for) is generated automatically from the
                // name (see CreateManager), the same as the password.
                Forms\Components\TextInput::make('email')
                    ->label('Username')
                    ->email()->unique(ignoreRecord: true)
                    ->required(fn (string $operation) => $operation === 'edit')
                    ->hidden(fn (string $operation) => $operation === 'create')
                    ->dehydrated(fn (string $operation) => $operation === 'edit'),
                // Only shown when editing — on create, a password is
                // generated automatically (see CreateManager) rather than
                // typed by Admin. On edit, filling this resets it manually;
                // left blank, the existing password is kept.
                Forms\Components\TextInput::make('plain_password')
                    ->label('Password')
                    ->password()
                    ->revealable()
                    ->hidden(fn (string $operation) => $operation === 'create')
                    ->dehydrated(fn ($state) => filled($state))
                    ->dehydrateStateUsing(fn ($state) => Hash::make($state))
                    ->helperText('Leave blank to keep existing password'),
            ])->columns(3),

            Forms\Components\Section::make('Assigned Sections')
                ->description('Select individual sections this manager can access.')
                ->schema([
                    Forms\Components\CheckboxList::make('manager_sections')
                        ->label('')
                        ->options($sections)
                        ->columns(3)
                        ->required(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('designation')->placeholder('—')->searchable(),
                Tables\Columns\TextColumn::make('email')
                    ->label('Username')
                    ->searchable()
                    ->copyable()
                    ->copyMessage('Username copied'),
                Tables\Columns\TextColumn::make('manager_sections')
                    ->label('Sections')
                    // Read straight off the model (guaranteed a real array via
                    // its 'array' cast) rather than trusting whatever raw
                    // $state the table column pipeline hands over — that was
                    // showing '—' for every manager despite sections being
                    // saved correctly (confirmed via the Edit form).
                    // Stored values are resource class names (individual
                    // sections, not whole groups) — mapped back to their
                    // human label here rather than shown as raw class names.
                    ->getStateUsing(function (User $record) {
                        $classes = $record->manager_sections ?? [];
                        return collect($classes)
                            ->map(fn ($class) => class_exists($class) ? $class::getNavigationLabel() : null)
                            ->filter()
                            ->values()
                            ->all();
                    })
                    // No formatStateUsing here — when a column's state is an
                    // array, Filament already renders + joins each item on
                    // its own (calling any formatStateUsing per item, a
                    // single label string, not the whole array), which is
                    // exactly what crashed: implode(', ', $state) expected an
                    // array and got a string. placeholder() covers the
                    // empty-array case instead.
                    ->placeholder('—')
                    ->wrap(),
                Tables\Columns\TextColumn::make('manager_plain_password')
                    ->label('Password')
                    ->formatStateUsing(fn ($state) => $state ?? '—')
                    ->copyable()
                    ->copyMessage('Password copied'),
                Tables\Columns\TextColumn::make('manager_login_link')
                    ->label('Login Link')
                    ->getStateUsing(fn () => url('/manager'))
                    ->copyable()
                    ->copyMessage('Link copied'),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
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
            'index'  => Pages\ListManagers::route('/'),
            'create' => Pages\CreateManager::route('/create'),
            'edit'   => Pages\EditManager::route('/{record}/edit'),
        ];
    }
}
