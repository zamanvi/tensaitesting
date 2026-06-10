<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        Role::firstOrCreate(['name' => 'branch_admin',   'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'branch_manager', 'guard_name' => 'web']);
    }

    public function down(): void
    {
        Role::where('name', 'branch_admin')->delete();
        Role::where('name', 'branch_manager')->delete();
    }
};
