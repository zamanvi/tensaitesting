<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extend status ENUM
        DB::statement("ALTER TABLE `institution_selections` MODIFY COLUMN `status`
            ENUM('selected','cancelled','accepted','rejected','processing','complete','incomplete')
            NOT NULL DEFAULT 'selected'");

        // Add timestamp columns if not already present
        $columns = DB::select("
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'institution_selections'
        ");
        $existing = array_column($columns, 'COLUMN_NAME');

        if (!in_array('accepted_at', $existing)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `accepted_at` TIMESTAMP NULL AFTER `selected_at`");
        }
        if (!in_array('rejected_at', $existing)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `rejected_at` TIMESTAMP NULL AFTER `accepted_at`");
        }
        if (!in_array('processing_at', $existing)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `processing_at` TIMESTAMP NULL AFTER `rejected_at`");
        }
        if (!in_array('completed_at', $existing)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `completed_at` TIMESTAMP NULL AFTER `processing_at`");
        }
    }

    public function down(): void {}
};
