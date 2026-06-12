<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('manager_sections')->nullable()->after('gateway_type');
            $table->string('manager_plain_password')->nullable()->after('manager_sections');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['manager_sections', 'manager_plain_password']);
        });
    }
};
