<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('blood_group', 5)->nullable()->after('gender');
            $table->string('mobile_number', 20)->nullable()->after('blood_group');
            $table->string('whatsapp_number', 20)->nullable()->after('mobile_number');
            $table->json('family_info')->nullable()->after('whatsapp_number');
            $table->json('permanent_address')->nullable()->after('family_info');
            $table->json('present_address')->nullable()->after('permanent_address');
            $table->json('education_history')->nullable()->after('present_address');
            $table->json('sponsor_info')->nullable()->after('education_history');
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'blood_group', 'mobile_number', 'whatsapp_number',
                'family_info', 'permanent_address', 'present_address',
                'education_history', 'sponsor_info',
            ]);
        });
    }
};
