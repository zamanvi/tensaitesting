<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GalleryItemResource\Pages;
use App\Models\Branch;
use App\Models\GalleryItem;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class GalleryItemResource extends Resource
{
    protected static ?string $model = GalleryItem::class;
    protected static ?string $navigationIcon = 'heroicon-o-photo';
    protected static ?string $navigationGroup = 'Content';
    protected static ?string $navigationLabel = 'Gallery';
    protected static ?int $navigationSort = 1;

    public static function canAccess(): bool
    {
        return (bool) auth()->user()?->hasRole(['super_admin', 'admin']);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([

            Forms\Components\Section::make('Basic Info')
                ->description('The title and category are what visitors see first in the gallery grid.')
                ->icon('heroicon-o-identification')
                ->schema([
                    Forms\Components\TextInput::make('title')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('e.g. Ahmed enrolled at Osaka University'),

                    Forms\Components\Select::make('category')
                        ->options([
                            'students'   => '🎓 Students',
                            'japan'      => '🇯🇵 Japan',
                            'milestones' => '🏆 Milestones',
                            'agencies'   => '🏢 Agencies',
                            'events'     => '🎉 Events',
                            'docs'       => '📄 Docs',
                            'departures' => '✈️ Departures',
                            'institutes' => '🏫 Institutes',
                        ])
                        ->required(),

                    Forms\Components\Textarea::make('description')
                        ->label('Short Summary')
                        ->rows(2)
                        ->maxLength(300)
                        ->placeholder('One or two lines shown below the title in gallery grid.')
                        ->columnSpanFull(),

                    Forms\Components\Select::make('branch_id')
                        ->label('Branch (optional)')
                        ->helperText('Tag this post to a branch to show it on that branch\'s public page too. Leave blank for a company-wide post.')
                        ->options(fn () => Branch::pluck('name', 'id'))
                        ->searchable()
                        ->columnSpanFull(),
                ])->columns(2),

            Forms\Components\Section::make('Images')
                ->description('Upload a cover image from your computer, OR paste an external URL below. Upload takes priority. You can add up to 2 more images below — 3 images total per post.')
                ->icon('heroicon-o-photo')
                ->schema([
                    Forms\Components\FileUpload::make('image_path')
                        ->label('Cover Image')
                        ->image()
                        ->disk(fn () => app()->environment('production') ? 'r2' : 'public')
                        ->directory('gallery')
                        ->visibility('public')
                        ->maxSize(8192)
                        ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
                        ->helperText('JPG, PNG, WebP — max 8 MB. Shown in the gallery grid and as the main image. If the preview below sits on "Loading" for a while, that\'s just the browser fetching the thumbnail — the image itself has already uploaded fine.')
                        ->columnSpanFull(),

                    Forms\Components\TextInput::make('image_url')
                        ->label('Or Paste External Image URL')
                        ->url()
                        ->placeholder('https://i.imgur.com/example.jpg')
                        ->helperText('Used only if no cover image is uploaded above. Paste from Imgur, Google Drive, etc.')
                        ->columnSpanFull(),

                    Forms\Components\FileUpload::make('extra_images')
                        ->label('Additional Images (optional)')
                        ->image()
                        ->multiple()
                        ->maxFiles(2)
                        ->disk(fn () => app()->environment('production') ? 'r2' : 'public')
                        ->directory('gallery')
                        ->visibility('public')
                        ->maxSize(8192)
                        ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
                        ->helperText('Up to 2 more photos shown alongside the cover image on the post detail view.')
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Full Story')
                ->description('Write the full success story or event details here. Shown on the gallery detail view, below the short summary.')
                ->icon('heroicon-o-document-text')
                ->collapsible()
                ->schema([
                    Forms\Components\RichEditor::make('content')
                        ->label('')
                        ->toolbarButtons([
                            'bold', 'italic', 'underline',
                            'bulletList', 'orderedList',
                            'h2', 'h3',
                            'blockquote',
                            'link',
                            'undo', 'redo',
                        ])
                        ->placeholder('Write the full story here — student background, process, outcome...')
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Visibility & Order')
                ->description('Control whether this post is public, and where it appears relative to others.')
                ->icon('heroicon-o-eye')
                ->schema([
                    Forms\Components\Toggle::make('is_featured')
                        ->label('Featured on homepage')
                        ->helperText('Shows in the Gallery section on the public landing page')
                        ->default(false),

                    Forms\Components\Toggle::make('is_active')
                        ->label('Active (visible to public)')
                        ->default(true),

                    Forms\Components\TextInput::make('sort_order')
                        ->label('Sort Order')
                        ->numeric()
                        ->default(0)
                        ->helperText('Lower number appears first'),
                ])->columns(3),

        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('display_image_url')
                    ->label('Image')
                    ->width(80)
                    ->height(56)
                    ->extraImgAttributes(['class' => 'object-cover rounded-lg']),

                Tables\Columns\TextColumn::make('title')
                    ->searchable()
                    ->weight('bold')
                    ->description(fn (GalleryItem $r) => $r->description ? \Str::limit($r->description, 60) : null),

                Tables\Columns\TextColumn::make('branch.name')
                    ->label('Branch')
                    ->badge()
                    ->color('gray')
                    ->placeholder('— company-wide —'),

                Tables\Columns\TextColumn::make('category')
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        'students'   => 'success',
                        'japan'      => 'danger',
                        'milestones' => 'warning',
                        'agencies'   => 'primary',
                        'events'     => 'info',
                        'departures' => 'success',
                        'institutes' => 'primary',
                        default      => 'gray',
                    })
                    ->formatStateUsing(fn (string $state) => ucfirst($state)),

                Tables\Columns\IconColumn::make('is_featured')
                    ->label('Featured')
                    ->boolean(),

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
            ->filters([
                SelectFilter::make('category')
                    ->options([
                        'students'   => 'Students',
                        'japan'      => 'Japan',
                        'milestones' => 'Milestones',
                        'agencies'   => 'Agencies',
                        'events'     => 'Events',
                        'docs'       => 'Docs',
                        'departures' => 'Departures',
                        'institutes' => 'Institutes',
                    ]),
                TernaryFilter::make('is_featured')->label('Featured'),
                TernaryFilter::make('is_active')->label('Active'),
            ])
            ->defaultSort('sort_order')
            ->reorderable('sort_order')
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

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListGalleryItems::route('/'),
            'create' => Pages\CreateGalleryItem::route('/create'),
            'edit'   => Pages\EditGalleryItem::route('/{record}/edit'),
        ];
    }
}
