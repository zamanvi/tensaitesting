<?php

namespace App\Filament\Resources;

use App\Filament\Resources\GalleryItemResource\Pages;
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
    protected static ?string $navigationGroup = 'System';
    protected static ?string $navigationLabel = 'Gallery';
    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([

            Forms\Components\Section::make('Basic Info')->schema([
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
            ])->columns(2),

            Forms\Components\Section::make('Image')
                ->description('Upload an image from your computer, OR paste an external URL below. Upload takes priority.')
                ->schema([
                    Forms\Components\FileUpload::make('image_path')
                        ->label('Upload Image from Computer')
                        ->image()
                        ->disk('public')
                        ->directory('gallery')
                        ->imageEditor()
                        ->imageEditorAspectRatios(['16:9', '4:3', '1:1'])
                        ->maxSize(8192)
                        ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
                        ->helperText('JPG, PNG, WebP — max 8 MB. You can crop/edit after selecting.')
                        ->columnSpanFull(),

                    Forms\Components\TextInput::make('image_url')
                        ->label('Or Paste External Image URL')
                        ->url()
                        ->placeholder('https://i.imgur.com/example.jpg')
                        ->helperText('Used only if no file is uploaded above. Paste from Imgur, Google Drive, etc.')
                        ->columnSpanFull(),
                ]),

            Forms\Components\Section::make('Full Story')
                ->description('Write the full success story or event details here. Shown on the gallery detail view.')
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

            Forms\Components\Section::make('Visibility & Order')->schema([
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
