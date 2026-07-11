<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure status ENUM has all required values
        DB::statement("ALTER TABLE `institution_selections` MODIFY COLUMN `status`
            ENUM('selected','cancelled','accepted','rejected','processing','complete','incomplete')
            NOT NULL DEFAULT 'selected'");

        // Ensure timestamp columns exist
        $columns = array_column(
            DB::select("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'institution_selections'"),
            'COLUMN_NAME'
        );

        if (!in_array('accepted_at', $columns)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `accepted_at` TIMESTAMP NULL");
        }
        if (!in_array('rejected_at', $columns)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `rejected_at` TIMESTAMP NULL");
        }
        if (!in_array('processing_at', $columns)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `processing_at` TIMESTAMP NULL");
        }
        if (!in_array('completed_at', $columns)) {
            DB::statement("ALTER TABLE `institution_selections` ADD COLUMN `completed_at` TIMESTAMP NULL");
        }

        // Ensure Application status ENUM includes 'pool' and 'processing'
        $appCol = DB::selectOne("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'status'");

        if ($appCol) {
            $type = strtolower($appCol->COLUMN_TYPE);
            if (!str_contains($type, 'pool') || !str_contains($type, 'processing') || !str_contains($type, 'complete')) {
                DB::statement("ALTER TABLE `applications` MODIFY COLUMN `status`
                    ENUM('draft','submitted','accepted','rejected','pool','selected','processing','complete','incomplete')
                    NOT NULL DEFAULT 'draft'");
            }
        }
    }

    public function down(): void {}
};
