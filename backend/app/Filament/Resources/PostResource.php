<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PostResource\Pages;
use App\Models\Category;
use App\Models\Post;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Forms\Get;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class PostResource extends Resource
{
    protected static ?string $model           = Post::class;
    protected static ?string $navigationIcon  = 'heroicon-o-newspaper';
    protected static ?string $navigationLabel = 'Posts / News';
    protected static ?string $navigationGroup = 'Content';
    protected static ?int    $navigationSort  = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Content')->schema([
                Forms\Components\TextInput::make('title')
                    ->required()
                    ->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn ($state, callable $set) =>
                        $set('slug', Str::slug($state))
                    ),
                Forms\Components\TextInput::make('slug')
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),
                Forms\Components\Select::make('type')
                    ->options([
                        'video'   => '🎬 YouTube Video',
                        'article' => '📰 Article / Link',
                        'text'    => '✍️ Original Text',
                    ])
                    ->required()
                    ->live(),
                Forms\Components\TextInput::make('video_url')
                    ->label('YouTube URL')
                    ->url()
                    ->placeholder('https://www.youtube.com/watch?v=...')
                    ->visible(fn (Get $get) => $get('type') === 'video'),
                Forms\Components\Textarea::make('excerpt')
                    ->label('Preview Text (shown without login)')
                    ->required()
                    ->rows(3)
                    ->maxLength(500),
                Forms\Components\RichEditor::make('body')
                    ->label('Full Content (shown after login)')
                    ->toolbarButtons(['bold','italic','bulletList','orderedList','link','blockquote'])
                    ->nullable(),
                Forms\Components\TextInput::make('thumbnail_url')
                    ->label('Thumbnail URL (optional — auto from YouTube)')
                    ->url()
                    ->nullable(),
            ]),

            Forms\Components\Section::make('Categories & Publishing')->schema([
                Forms\Components\CheckboxList::make('categories')
                    ->relationship('categories', 'name')
                    ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->flag} {$record->name}")
                    ->columns(3)
                    ->label('Tags (Country + Purpose)'),
                Forms\Components\Select::make('status')
                    ->options(['draft' => 'Draft', 'published' => 'Published'])
                    ->required()
                    ->default('draft'),
                Forms\Components\DateTimePicker::make('published_at')
                    ->label('Publish Date')
                    ->nullable(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->formatStateUsing(fn ($state) => match($state) {
                        'video'   => '🎬 Video',
                        'article' => '📰 Article',
                        default   => '✍️ Text',
                    }),
                Tables\Columns\TextColumn::make('title')->searchable()->limit(50)->sortable(),
                Tables\Columns\TextColumn::make('categories.name')
                    ->badge()
                    ->separator(',')
                    ->limit(3),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => $state === 'published' ? 'success' : 'warning'),
                Tables\Columns\TextColumn::make('published_at')->dateTime()->sortable()->since(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(['draft' => 'Draft', 'published' => 'Published']),
                Tables\Filters\SelectFilter::make('type')
                    ->options(['video' => 'Video', 'article' => 'Article', 'text' => 'Text']),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('publish')
                    ->label('Publish')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn ($record) => $record->status === 'draft')
                    ->action(function ($record) {
                        $record->update(['status' => 'published', 'published_at' => now()]);
                        Notification::make()->title('Published!')->success()->send();
                    }),
                Tables\Actions\DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListPosts::route('/'),
            'create' => Pages\CreatePost::route('/create'),
            'edit'   => Pages\EditPost::route('/{record}/edit'),
        ];
    }
}
