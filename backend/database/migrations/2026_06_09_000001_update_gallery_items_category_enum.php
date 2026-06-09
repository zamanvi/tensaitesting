<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Map old values to new ones before altering the enum
        // Old values: success_story, event, campus, student_life, milestone
        // New values: students, japan, milestones, agencies, events, docs, departures, institutes
        DB::statement("UPDATE gallery_items SET category = 'milestones' WHERE category = 'milestone'");
        DB::statement("UPDATE gallery_items SET category = 'events'     WHERE category = 'event'");
        DB::statement("UPDATE gallery_items SET category = 'students'   WHERE category IN ('success_story','campus','student_life')");

        // Widen the enum to include both old and new values first (avoids truncation warning)
        DB::statement("ALTER TABLE gallery_items MODIFY COLUMN category ENUM(
            'success_story','event','campus','student_life','milestone',
            'students','japan','milestones','agencies','events','docs','departures','institutes'
        ) NOT NULL DEFAULT 'students'");

        // Now safe to drop old values
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
