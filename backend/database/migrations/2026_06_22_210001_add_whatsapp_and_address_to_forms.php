<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Template-level defaults shown in Application Form Info
        Schema::table('form_templates', function (Blueprint $table) {
            $table->string('contact_phone')->nullable()->after('passport_no');
            $table->string('whatsapp_no')->nullable()->after('contact_phone');
            $table->text('permanent_address')->nullable()->after('whatsapp_no');
        });

        // Captured on each application
        Schema::table('applications', function (Blueprint $table) {
            $table->string('whatsapp_no')->nullable()->after('student_phone');
            $table->text('permanent_address')->nullable()->after('whatsapp_no');
        });
    }

    public function down(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->dropColumn(['contact_phone', 'whatsapp_no', 'permanent_address']);
        });
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_no', 'permanent_address']);
        });
    }
};
