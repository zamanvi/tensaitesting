<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

// What a person asked the Answer Library and what they got back.
class AnswerLibraryQuestion extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'question', 'lang', 'item_id', 'outcome', 'score', 'helpful', 'handled_at',
    ];

    protected $casts = [
        'helpful'    => 'boolean',
        'score'      => 'float',
        'handled_at' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(AnswerLibraryItem::class, 'item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
