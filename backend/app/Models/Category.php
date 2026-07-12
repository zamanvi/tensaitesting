<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'type', 'flag', 'color', 'sort_order'];

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class);
    }
}
