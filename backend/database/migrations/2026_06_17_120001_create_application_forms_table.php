<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->unique()->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->constrained();

            // Personal
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('address')->nullable();
            $table->string('passport_number')->nullable();
            $table->date('passport_expiry')->nullable();

            // Academic
            $table->string('last_qualification')->nullable(); // SSC/HSC/Diploma/Bachelor/Masters
            $table->string('institution_name')->nullable();
            $table->string('board_university')->nullable();
            $table->string('gpa_grade')->nullable();
            $table->unsignedSmallInteger('passing_year')->nullable();

            // Language
            $table->string('jlpt_level')->nullable();   // N1/N2/N3/N4/N5/None/Preparing
            $table->string('jlpt_score')->nullable();
            $table->date('jlpt_exam_date')->nullable();
            $table->string('english_proficiency')->nullable(); // IELTS/TOEFL/Duolingo/None
            $table->string('english_score')->nullable();

            // Study preferences
            $table->string('preferred_institution')->nullable();
            $table->json('preferred_cities')->nullable();

            // Sponsor / Financial
            $table->string('sponsor_name')->nullable();
            $table->string('sponsor_relationship')->nullable(); // Father/Mother/Self/Other
            $table->string('sponsor_occupation')->nullable();
            $table->string('sponsor_monthly_income')->nullable();

            // Meta
            $table->unsignedTinyInteger('progress')->default(0);
            $table->string('status')->default('draft'); // draft | submitted
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_forms');
    }
};
