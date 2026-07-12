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
    protected static ?string $model                = Post::class;
    protected static ?string $navigationIcon       = 'heroicon-o-newspaper';
    protected static ?string $navigationLabel      = 'Posts / News';
    protected static ?string $navigationGroup      = 'Content';
    protected static ?int    $navigationSort       = 1;
    protected static ?string $recordTitleAttribute = 'title';

    public static function canAccess(): bool
    {
        return auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Content')->schema([
                Forms\Components\Hidden::make('created_by')
                    ->default(fn () => auth()->id()),

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
                    ->maxLength(255)
                    ->helperText('Auto-generated from title. URL-safe, lowercase, hyphens only.'),

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
                    ->required(fn (Get $get) => $get('type') === 'video')
                    ->visible(fn (Get $get) => $get('type') === 'video')
                    ->helperText('Paste the full YouTube video URL.'),

                Forms\Components\Textarea::make('excerpt')
                    ->label('Preview Text (shown to guests without login)')
                    ->required()
                    ->rows(3)
                    ->maxLength(500)
                    ->helperText('Keep it short and enticing — this is all guests see.'),

                Forms\Components\RichEditor::make('body')
                    ->label('Full Content (shown after login)')
                    ->toolbarButtons(['bold', 'italic', 'bulletList', 'orderedList', 'link', 'blockquote'])
                    ->nullable()
                    ->helperText('Optional for video posts. Required if this is an article or text post.'),

                Forms\Components\TextInput::make('thumbnail_url')
                    ->label('Thumbnail URL')
                    ->url()
                    ->nullable()
                    ->helperText('Optional — auto-detected from YouTube if left blank.'),
            ]),

            Forms\Components\Section::make('Categories & Publishing')->schema([
                Forms\Components\CheckboxList::make('categories')
                    ->relationship('categories', 'name')
                    ->getOptionLabelFromRecordUsing(fn ($record) => "{$record->flag} {$record->name}")
                    ->columns(3)
                    ->label('Tags (Country + Purpose)')
                    ->helperText('Select at least one country and one purpose for best discoverability.'),

                Forms\Components\Select::make('status')
                    ->options(['draft' => 'Draft', 'published' => 'Published'])
                    ->required()
                    ->default('draft'),

                Forms\Components\DateTimePicker::make('published_at')
                    ->label('Publish Date')
                    ->nullable()
                    ->helperText('Leave blank to use current time when publishing.'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('thumbnail')
                    ->label('')
                    ->getStateUsing(fn ($record) => $record->thumbnail)
                    ->width(64)
                    ->height(42)
                    ->extraImgAttributes(['style' => 'object-fit:cover;border-radius:6px;']),

                Tables\Columns\TextColumn::make('type')
                    ->badge()
                    ->color(fn ($state) => match ($state) {
                        'video'   => 'danger',
                        'article' => 'warning',
                        default   => 'primary',
                    })
                    ->formatStateUsing(fn ($state) => match ($state) {
                        'video'   => '🎬 Video',
                        'article' => '📰 Article',
                        default   => '✍️ Text',
                    }),

                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->sortable()
                    ->limit(45)
                    ->tooltip(fn ($record) => $record->title),

                Tables\Columns\TextColumn::make('categories.name')
                    ->badge()
                    ->separator(',')
                    ->limit(3)
                    ->color('gray'),

                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->color(fn ($state) => $state === 'published' ? 'success' : 'warning'),

                Tables\Columns\TextColumn::make('published_at')
                    ->dateTime()
                    ->sortable()
                    ->since()
                    ->placeholder('—'),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(['draft' => 'Draft', 'published' => 'Published']),
                Tables\Filters\SelectFilter::make('type')
                    ->options(['video' => '🎬 Video', 'article' => '📰 Article', 'text' => '✍️ Text']),
            ])
            ->actions([
                Tables\Actions\Action::make('view_site')
                    ->label('Preview')
                    ->icon('heroicon-o-eye')
                    ->color('gray')
                    ->url(fn ($record) => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/') . '/feed/' . $record->slug)
                    ->openUrlInNewTab(),

                Tables\Actions\EditAction::make(),

                Tables\Actions\Action::make('publish')
                    ->label('Publish')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn ($record) => $record->status === 'draft')
                    ->action(function ($record) {
                        $record->update([
                            'status'       => 'published',
                            'published_at' => $record->published_at ?? now(),
                        ]);
                        Notification::make()->title('Published!')->success()->send();
                    }),

                Tables\Actions\Action::make('unpublish')
                    ->label('Unpublish')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('warning')
                    ->visible(fn ($record) => $record->status === 'published')
                    ->requiresConfirmation()
                    ->modalHeading('Move back to Draft?')
                    ->modalDescription('This post will no longer be visible to users.')
                    ->action(function ($record) {
                        $record->update(['status' => 'draft']);
                        Notification::make()->title('Moved to draft')->warning()->send();
                    }),

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
            'index'  => Pages\ListPosts::route('/'),
            'create' => Pages\CreatePost::route('/create'),
            'edit'   => Pages\EditPost::route('/{record}/edit'),
        ];
    }
}
