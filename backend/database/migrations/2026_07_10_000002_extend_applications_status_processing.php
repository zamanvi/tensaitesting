<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $col = DB::selectOne("
            SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'applications'
              AND COLUMN_NAME = 'status'
        ");
        if (!$col) return;

        $type = strtolower($col->COLUMN_TYPE);
        if (!str_contains($type, 'processing')) {
            DB::statement("ALTER TABLE `applications` MODIFY COLUMN `status`
                ENUM('draft','submitted','accepted','rejected','pool','selected','processing','complete','incomplete')
                NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void {}
};
