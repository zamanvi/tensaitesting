<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Force status column to VARCHAR to allow pool/selected values
        // Raw SQL works regardless of doctrine/dbal availability
        DB::statement("ALTER TABLE applications MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft'");
    }

    public function down(): void {}
};
