<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Widens the `method` enum from cash/bank to also cover the mobile
    // financial services (MFS) that actually move most retail money in
    // Bangladesh. Raw SQL — Laravel's schema builder has no first-class
    // "modify an enum's values" helper.
    public function up(): void
    {
        DB::statement("ALTER TABLE payments MODIFY method ENUM('cash', 'bank', 'bkash', 'nagad', 'rocket') NOT NULL DEFAULT 'cash'");
    }

    public function down(): void
    {
        DB::statement("UPDATE payments SET method = 'cash' WHERE method NOT IN ('cash', 'bank')");
        DB::statement("ALTER TABLE payments MODIFY method ENUM('cash', 'bank') NOT NULL DEFAULT 'cash'");
    }
};
