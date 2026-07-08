<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure all gateway-type roles exist
        $roles = ['student', 'agency', 'institution', 'affiliate'];
        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role, 'guard_name' => 'web'],
                ['name' => $role, 'guard_name' => 'web', 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // For every user with a gateway_type, ensure they have the matching role
        $users = DB::table('users')->whereNotNull('gateway_type')->get();
        foreach ($users as $user) {
            $role = DB::table('roles')
                ->where('name', $user->gateway_type)
                ->where('guard_name', 'web')
                ->first();

            if (!$role) continue;

            // Remove old gateway-type roles for this user
            $roleIds = DB::table('roles')->whereIn('name', $roles)->pluck('id');
            DB::table('model_has_roles')
                ->where('model_type', 'App\\Models\\User')
                ->where('model_id', $user->id)
                ->whereIn('role_id', $roleIds)
                ->delete();

            // Insert the correct role
            DB::table('model_has_roles')->insertOrIgnore([
                'role_id'    => $role->id,
                'model_type' => 'App\\Models\\User',
                'model_id'   => $user->id,
            ]);
        }
    }

    public function down(): void {}
};
