<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionAccountManager extends Model
{
    protected $table = 'institution_account_managers';

    protected $fillable = ['institution_id', 'name', 'role', 'email', 'phone'];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(User::class, 'institution_id');
    }
}
