<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            // Replace single education/document columns with JSON array
            $table->dropColumn(['education', 'education_document']);
            $table->json('educations')->nullable()->after('passport_no');
        });
    }

    public function down(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->dropColumn('educations');
            $table->string('education')->nullable();
            $table->string('education_document')->nullable();
        });
    }
};
