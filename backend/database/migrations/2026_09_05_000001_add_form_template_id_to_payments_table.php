<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Admin's Create Memo can now tag a memo with which published
        // Service Form it's for, without requiring a real student
        // Application to exist yet — separate from application_id, which
        // stays how the branch dashboard flow links a memo to a real
        // applicant.
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('form_template_id')->nullable()->after('application_id')
                ->constrained('form_templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('form_template_id');
        });
    }
};
