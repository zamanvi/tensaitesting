<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Force the ENUM to include all required values regardless of current state
        DB::statement("
            ALTER TABLE `institution_selections`
            MODIFY COLUMN `status`
            ENUM('selected','cancelled','accepted','rejected','processing','complete','incomplete')
            NOT NULL DEFAULT 'selected'
        ");
    }

    public function down(): void {}
};
