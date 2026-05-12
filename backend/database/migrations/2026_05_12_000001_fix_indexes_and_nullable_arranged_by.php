<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Make arranged_by nullable so Filament can create interview records
        Schema::table('interviews', function (Blueprint $table) {
            $table->unsignedBigInteger('arranged_by')->nullable()->change();
        });

        // Performance indexes — leads
        Schema::table('leads', function (Blueprint $table) {
            $table->index('status');
            $table->index(['pool_type', 'is_published']);
        });

        // Performance indexes — interviews
        Schema::table('interviews', function (Blueprint $table) {
            $table->index('status');
            $table->index('scheduled_at');
        });

        // Performance indexes — commissions
        Schema::table('commissions', function (Blueprint $table) {
            $table->index('status');
            $table->index('type');
        });

        // Performance indexes — ocr_jobs
        Schema::table('ocr_jobs', function (Blueprint $table) {
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->unsignedBigInteger('arranged_by')->nullable(false)->change();
            $table->dropIndex(['status']);
            $table->dropIndex(['scheduled_at']);
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['pool_type', 'is_published']);
        });

        Schema::table('commissions', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['type']);
        });

        Schema::table('ocr_jobs', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
