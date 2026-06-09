<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Widen enum FIRST to include both old AND new values
        DB::statement("ALTER TABLE gallery_items MODIFY COLUMN category ENUM(
            'success_story','event','campus','student_life','milestone',
            'students','japan','milestones','agencies','events','docs','departures','institutes'
        ) NOT NULL DEFAULT 'success_story'");

        // Step 2: Now safe to remap old values → new values
        DB::statement("UPDATE gallery_items SET category = 'milestones' WHERE category = 'milestone'");
        DB::statement("UPDATE gallery_items SET category = 'events'     WHERE category = 'event'");
        DB::statement("UPDATE gallery_items SET category = 'students'   WHERE category IN ('success_story','campus','student_life')");

        // Step 3: Narrow to new values only (all old values are gone now)
        DB::statement("ALTER TABLE gallery_items MODIFY COLUMN category ENUM(
            'students','japan','milestones','agencies','events','docs','departures','institutes'
        ) NOT NULL DEFAULT 'students'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE gallery_items MODIFY COLUMN category ENUM(
            'success_story','event','campus','student_life','milestone'
        ) NOT NULL DEFAULT 'success_story'");
    }
};
