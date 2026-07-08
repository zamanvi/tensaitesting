<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        User::whereNotNull('gateway_type')->get()->each(function (User $user) {
            $user->syncRoles([$user->gateway_type]);
        });
    }

    public function down(): void {}
};
