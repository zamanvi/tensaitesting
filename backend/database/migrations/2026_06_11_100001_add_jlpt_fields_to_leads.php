<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('jlpt_nat_score')->nullable()->after('target_intake');
            $table->date('jlpt_nat_result_date')->nullable()->after('jlpt_nat_score');
            $table->date('expected_jlpt_nat_exam_date')->nullable()->after('jlpt_nat_result_date');
            $table->json('preferred_cities')->nullable()->after('expected_jlpt_nat_exam_date');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['jlpt_nat_score', 'jlpt_nat_result_date', 'expected_jlpt_nat_exam_date', 'preferred_cities']);
        });
    }
};
