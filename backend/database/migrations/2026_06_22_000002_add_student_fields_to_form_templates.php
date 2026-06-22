<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->string('student_name')->nullable()->after('birth_date');
            $table->string('passport_no')->nullable()->after('student_name');
            $table->string('education')->nullable()->after('passport_no');
        });
    }

    public function down(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->dropColumn(['student_name', 'passport_no', 'education']);
        });
    }
};
