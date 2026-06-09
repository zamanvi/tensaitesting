<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the category enum to match what AdminGalleryController validates
        // Old values: success_story, event, campus, student_life, milestone
        // New values: students, japan, milestones, agencies, events, docs, departures, institutes
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
