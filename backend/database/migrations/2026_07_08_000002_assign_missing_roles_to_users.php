<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\User;

return new class extends Migration
{
    public function up(): void
    {
        User::whereNotNull('gateway_type')->get()->each(function (User $user) {
            try {
                $user->syncRoles([$user->gateway_type]);
            } catch (\Throwable $e) {
                // Role may not exist yet — skip silently
            }
        });
    }

    public function down(): void {}
};
