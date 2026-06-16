<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Add 'branch' to gateway_type enum
        DB::statement("ALTER TABLE users MODIFY COLUMN gateway_type ENUM('student','agency','institution','affiliate','branch') NOT NULL DEFAULT 'student'");

        // Add whatsapp column if not exists
        if (!Schema::hasColumn('users', 'whatsapp')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('whatsapp', 20)->nullable()->after('phone');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'whatsapp')) {
                $table->dropColumn('whatsapp');
            }
        });

        DB::statement("ALTER TABLE users MODIFY COLUMN gateway_type ENUM('student','agency','institution','affiliate') NOT NULL DEFAULT 'student'");
    }
};
