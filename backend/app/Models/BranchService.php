<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchService extends Model
{
    protected $fillable = [
        'branch_id', 'title', 'description',
        'icon', 'is_active', 'sort_order',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
