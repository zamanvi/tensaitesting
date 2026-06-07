<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // leads: speed up vault/pool queries and lead-exists checks
        Schema::table('leads', function (Blueprint $table) {
            $table->index(['source_agency_id', 'pool_type'], 'leads_agency_pool_idx');
            $table->index(['student_id', 'source_agency_id'], 'leads_student_agency_idx');
            $table->index(['assigned_institution_id', 'status'], 'leads_institution_status_idx');
        });

        // student_profiles: speed up institution browse
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->index('is_admin_verified', 'profiles_admin_verified_idx');
            $table->index(['jlpt_level', 'is_admin_verified'], 'profiles_jlpt_verified_idx');
        });

        // ocr_jobs: speed up per-user/profile queries
        Schema::table('ocr_jobs', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'ocr_jobs_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('leads_agency_pool_idx');
            $table->dropIndex('leads_student_agency_idx');
            $table->dropIndex('leads_institution_status_idx');
        });

        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropIndex('profiles_admin_verified_idx');
            $table->dropIndex('profiles_jlpt_verified_idx');
        });

        Schema::table('ocr_jobs', function (Blueprint $table) {
            $table->dropIndex('ocr_jobs_user_status_idx');
        });
    }
};
