<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the wrong FK (lead_id was constrained to leads table, but we store application IDs)
        // Use raw SQL to drop the FK regardless of its generated name
        try {
            $fks = DB::select("
                SELECT CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'institution_selections'
                  AND COLUMN_NAME = 'lead_id'
                  AND REFERENCED_TABLE_NAME IS NOT NULL
            ");
            foreach ($fks as $fk) {
                DB::statement("ALTER TABLE `institution_selections` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
            }
        } catch (\Throwable $e) {
            // FK may not exist (already dropped or never created)
        }

        // Add correct FK pointing to applications table
        try {
            DB::statement("ALTER TABLE `institution_selections` ADD CONSTRAINT `institution_selections_lead_id_applications_fk` FOREIGN KEY (`lead_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE");
        } catch (\Throwable $e) {
            // If applications FK already exists, skip
        }
    }

    public function down(): void {}
};
